const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('Auth header:', authHeader);
    console.log('Token extracted:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { id: decoded.id, username: decoded.username });
    
    // Check if decoded.id exists
    if (!decoded.id) {
      console.error('Token does not contain user ID');
      return res.status(403).json({ message: 'Invalid token structure' });
    }
    
    // Get user details from database to ensure user still exists
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name FROM user WHERE id = ?',
      [decoded.id]  // This should now be properly defined
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request
    req.user = users[0];
    console.log('User attached to request:', { id: req.user.id, username: req.user.username });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired' });
    } else {
      return res.status(500).json({ message: 'Authentication failed' });
    }
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.id) {
      req.user = null;
      return next();
    }
    
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name FROM user WHERE id = ?',
      [decoded.id]
    );
    
    req.user = users.length > 0 ? users[0] : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };