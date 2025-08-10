const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { 
  authenticateToken, 
  checkAccountLock, 
  recordLoginAttempt, 
  createSession,
  logout 
} = require('../middleware/auth');
const router = express.Router();
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         '127.0.0.1';
};
router.post('/register', async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number, address, city, postal_code, country } = req.body;
  
  try {
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const [existingUsers] = await db.execute(
      'SELECT id FROM user WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result] = await db.execute(
      `INSERT INTO user (username, email, password_hash, first_name, last_name, phone, primary_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, first_name, last_name, phone_number || null, address || null]
    );
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const sessionToken = await createSession(result.insertId, ipAddress, userAgent);
    const jwtToken = jwt.sign(
      { 
        id: result.insertId,
        email, 
        username 
      },
      process.env.JWT_SECRET || 'your-fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token: jwtToken, // For backward compatibility
      sessionToken: sessionToken,
      user: {
        id: result.insertId,
        username,
        email,
        first_name,
        last_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username
  
  try {
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    
    console.log('Login attempt:', { identifier, ipAddress });
    const lockStatus = await checkAccountLock(identifier, ipAddress);
    if (lockStatus.isLocked) {
      await recordLoginAttempt(identifier, ipAddress, false, userAgent);
      return res.status(423).json({ 
        message: `Account temporarily locked. Try again in ${lockStatus.remainingTime} minutes.`,
        lockedUntil: lockStatus.remainingTime,
        reason: lockStatus.reason
      });
    }
    const [users] = await db.execute(
      `SELECT id, username, email, password_hash, first_name, last_name, 
              account_locked_until, failed_login_attempts
       FROM user WHERE email = ? OR username = ?`,
      [identifier, identifier]
    );

    if (users.length === 0) {
      await recordLoginAttempt(identifier, ipAddress, false, userAgent);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      await recordLoginAttempt(identifier, ipAddress, false, userAgent);
      const remainingTime = Math.ceil((new Date(user.account_locked_until) - new Date()) / 1000 / 60);
      return res.status(423).json({ 
        message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
        lockedUntil: remainingTime
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await recordLoginAttempt(identifier, ipAddress, false, userAgent);
      await db.execute(
        'UPDATE user SET failed_login_attempts = failed_login_attempts + 1, last_failed_login = NOW() WHERE id = ?',
        [user.id]
      );
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    await recordLoginAttempt(identifier, ipAddress, true, userAgent);
    await db.execute(
      'UPDATE user SET failed_login_attempts = 0, last_login = NOW(), account_locked_until = NULL WHERE id = ?',
      [user.id]
    );
    const sessionToken = await createSession(user.id, ipAddress, userAgent);
    const jwtToken = jwt.sign(
      { 
        id: user.id,
        email: user.email, 
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', { id: user.id, username: user.username });

    res.json({
      message: 'Login successful',
      token: jwtToken, // For backward compatibility
      sessionToken: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (req.sessionToken) {
      await logout(req.sessionToken);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Getting profile for user ID:', req.user.id);
    
    const [users] = await db.execute(
      `SELECT id, username, email, first_name, last_name, phone, primary_address, 
              created_at, last_login, failed_login_attempts
       FROM user WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    
    res.json({ 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone,
        address: user.primary_address,
        registration_date: user.created_at,
        last_login: user.last_login,
        sessionType: req.sessionType
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});
router.put('/profile', authenticateToken, async (req, res) => {
  const { first_name, last_name, phone_number, address } = req.body;
  
  try {
    console.log('Updating profile for user ID:', req.user.id);
    
    await db.execute(
      `UPDATE user SET first_name = ?, last_name = ?, phone = ?, primary_address = ? 
       WHERE id = ?`,
      [first_name, last_name, phone_number, address, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});
router.get('/session/status', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    sessionType: req.sessionType
  });
});
router.get('/login-attempts', authenticateToken, async (req, res) => {
  try {
    if (req.user.username !== 'admin') { // Add proper admin check
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const [attempts] = await db.execute(`
      SELECT * FROM login_attempt 
      ORDER BY attempt_time DESC 
      LIMIT 100
    `);
    
    res.json(attempts);
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    res.status(500).json({ message: 'Failed to fetch login attempts' });
  }
});

module.exports = router;