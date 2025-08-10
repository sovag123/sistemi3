const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const SESSION_DURATION = 30 * 60 * 1000; 
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; 
const ATTEMPT_WINDOW = 15 * 60 * 1000; 
const cleanExpiredSessions = async () => {
  try {
    await db.execute(
      'DELETE FROM user_session WHERE expires_at < NOW() OR last_activity < DATE_SUB(NOW(), INTERVAL 30 MINUTE)'
    );
  } catch (error) {
    console.error('Error cleaning expired sessions:', error);
  }
};
const cleanExpiredAttempts = async () => {
  try {
    await db.execute(
      'DELETE FROM login_attempt WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
    await db.execute(
      'DELETE FROM account_lock WHERE locked_until < NOW()'
    );
  } catch (error) {
    console.error('Error cleaning expired attempts:', error);
  }
};
const checkAccountLock = async (identifier, ipAddress) => {
  try {
    const [locks] = await db.execute(`
      SELECT * FROM account_lock 
      WHERE (identifier = ? OR ip_address = ?) AND locked_until > NOW()
      ORDER BY locked_until DESC LIMIT 1
    `, [identifier, ipAddress]);
    
    if (locks.length > 0) {
      const lock = locks[0];
      const remainingTime = new Date(lock.locked_until) - new Date();
      return {
        isLocked: true,
        remainingTime: Math.ceil(remainingTime / 1000 / 60), 
        reason: lock.reason
      };
    }
    
    return { isLocked: false };
  } catch (error) {
    console.error('Error checking account lock:', error);
    return { isLocked: false };
  }
};
const recordLoginAttempt = async (identifier, ipAddress, success, userAgent) => {
  try {
    await db.execute(`
      INSERT INTO login_attempt (identifier, ip_address, success, user_agent)
      VALUES (?, ?, ?, ?)
    `, [identifier, ipAddress, success, userAgent]);
    
    if (!success) {
      const windowStart = new Date(Date.now() - ATTEMPT_WINDOW);
      const [attempts] = await db.execute(`
        SELECT COUNT(*) as count FROM login_attempt 
        WHERE (identifier = ? OR ip_address = ?) 
        AND success = FALSE 
        AND attempt_time > ?
      `, [identifier, ipAddress, windowStart]);
      
      if (attempts[0].count >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
        const [users] = await db.execute(`
          SELECT id FROM user WHERE email = ? OR username = ?
        `, [identifier, identifier]);
        
        const userId = users.length > 0 ? users[0].id : null;
        
        await db.execute(`
          INSERT INTO account_lock (user_id, identifier, ip_address, locked_until, reason)
          VALUES (?, ?, ?, ?, 'failed_attempts')
        `, [userId, identifier, ipAddress, lockUntil]);
        if (userId) {
          await db.execute(`
            UPDATE user SET account_locked_until = ? WHERE id = ?
          `, [lockUntil, userId]);
        }
        
        return { locked: true, lockUntil };
      }
    }
    
    return { locked: false };
  } catch (error) {
    console.error('Error recording login attempt:', error);
    return { locked: false };
  }
};

const createSession = async (userId, ipAddress, userAgent) => {
  try {
    console.log('Creating session for user:', userId);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    console.log('Session details:', {
      userId,
      sessionToken: sessionToken.substring(0, 10) + '...',
      expiresAt,
      ipAddress,
      userAgent: userAgent?.substring(0, 50)
    });
    
    const [result] = await db.execute(`
      INSERT INTO user_session (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, sessionToken, expiresAt, ipAddress, userAgent]);
    
    console.log('Session inserted with ID:', result.insertId);
    return sessionToken;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};
const updateSessionActivity = async (sessionToken) => {
  try {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await db.execute(`
      UPDATE user_session 
      SET last_activity = NOW(), expires_at = ?
      WHERE session_token = ? AND is_active = TRUE
    `, [newExpiresAt, sessionToken]);
    
    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
};
const validateSession = async (sessionToken) => {
  try {
    const [sessions] = await db.execute(`
      SELECT us.*, u.id, u.username, u.email, u.first_name, u.last_name
      FROM user_session us
      JOIN user u ON us.user_id = u.id
      WHERE us.session_token = ? 
      AND us.is_active = TRUE 
      AND us.expires_at > NOW()
      AND us.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `, [sessionToken]);
    
    if (sessions.length === 0) {
      return null;
    }
    await updateSessionActivity(sessionToken);
    
    return sessions[0];
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
};
const authenticateToken = async (req, res, next) => {
  try {
    if (Math.random() < 0.1) { 
      cleanExpiredSessions();
      cleanExpiredAttempts();
    }
    
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1];
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('session='));
      if (sessionCookie) {
        token = sessionCookie.split('=')[1];
      }
    }
    
    console.log('Auth token:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id) {
        const [users] = await db.execute(
          'SELECT id, username, email, first_name, last_name FROM user WHERE id = ?',
          [decoded.id]
        );
        
        if (users.length > 0) {
          req.user = users[0];
          req.sessionType = 'jwt';
          return next();
        }
      }
    } catch (jwtError) {
      console.log('JWT validation failed, trying session token');
    }
    const sessionData = await validateSession(token);
    if (sessionData) {
      req.user = {
        id: sessionData.id,
        username: sessionData.username,
        email: sessionData.email,
        first_name: sessionData.first_name,
        last_name: sessionData.last_name
      };
      req.sessionToken = token;
      req.sessionType = 'session';
      console.log('Session validated for user:', req.user.username);
      return next();
    }
    
    return res.status(403).json({ message: 'Invalid or expired token' });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};
const logout = async (sessionToken) => {
  try {
    await db.execute(
      'UPDATE user_session SET is_active = FALSE WHERE session_token = ?',
      [sessionToken]
    );
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1];
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('session='));
      if (sessionCookie) {
        token = sessionCookie.split('=')[1];
      }
    }
    
    if (!token) {
      req.user = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id) {
        const [users] = await db.execute(
          'SELECT id, username, email, first_name, last_name FROM user WHERE id = ?',
          [decoded.id]
        );
        req.user = users.length > 0 ? users[0] : null;
        return next();
      }
    } catch (jwtError) {
      const sessionData = await validateSession(token);
      req.user = sessionData ? {
        id: sessionData.id,
        username: sessionData.username,
        email: sessionData.email,
        first_name: sessionData.first_name,
        last_name: sessionData.last_name
      } : null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { 
  authenticateToken, 
  optionalAuth, 
  checkAccountLock, 
  recordLoginAttempt, 
  createSession,
  logout,
  validateSession 
};