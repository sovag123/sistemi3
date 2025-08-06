const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/config');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, primaryAddress, locationId } = req.body;

    const [existingUser] = await db.execute(
      'SELECT id FROM user WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await db.execute(
      'INSERT INTO user (username, email, password_hash, first_name, last_name, phone, primary_address, location_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, firstName, lastName, phone, primaryAddress, locationId]
    );

    const token = jwt.sign(
      { userId: result.insertId, username, email },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        firstName,
        lastName
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.execute(
      'SELECT id, username, email, password_hash, first_name, last_name FROM user WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, phone, primary_address FROM user WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;