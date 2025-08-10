const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number, address, city, postal_code, country } = req.body;
  
  try {
    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM user WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await db.execute(
      `INSERT INTO user (username, email, password_hash, first_name, last_name, phone, primary_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, first_name, last_name, phone_number || null, address || null]
    );

    // Generate JWT token - FIX: Use 'id' instead of 'userId'
    const token = jwt.sign(
      { 
        id: result.insertId,  // Changed from userId to id
        email, 
        username 
      },
      process.env.JWT_SECRET || 'your-fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
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

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const [users] = await db.execute(
      'SELECT id, username, email, password_hash, first_name, last_name FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token - FIX: Use 'id' instead of 'userId'
    const token = jwt.sign(
      { 
        id: user.id,  // Changed from userId to id
        email: user.email, 
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-fallback-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', { id: user.id, username: user.username });

    res.json({
      message: 'Login successful',
      token,
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

// Get current user profile - FIX: Use req.user.id instead of req.user.userId
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Getting profile for user ID:', req.user.id);
    
    const [users] = await db.execute(
      `SELECT id, username, email, first_name, last_name, phone, primary_address, created_at
       FROM user WHERE id = ?`,
      [req.user.id]  // Changed from req.user.userId to req.user.id
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    
    // Format the response to match what the frontend expects
    res.json({ 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone,
        address: user.primary_address,
        city: '',
        postal_code: '',
        country: '',
        registration_date: user.created_at
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile - FIX: Use req.user.id instead of req.user.userId
router.put('/profile', authenticateToken, async (req, res) => {
  const { first_name, last_name, phone_number, address } = req.body;
  
  try {
    console.log('Updating profile for user ID:', req.user.id);
    
    await db.execute(
      `UPDATE user SET first_name = ?, last_name = ?, phone = ?, primary_address = ? 
       WHERE id = ?`,
      [first_name, last_name, phone_number, address, req.user.id]  // Changed from req.user.userId to req.user.id
    );

    res.json({ message: 'Profile updated successfully' });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;