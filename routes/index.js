const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET pages
router.get('/', (req, res) => res.render('index'));
router.get('/about', (req, res) => res.render('about'));
router.get('/contact', (req, res) => res.render('contact'));
router.get('/login', (req, res) => res.render('login'));

// Register page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register - selling.com' });
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, terms } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.render('register', { message: 'All fields are required', messageType: 'error' });
    }

    if (password !== confirmPassword) {
      return res.render('register', { message: 'Passwords do not match', messageType: 'error' });
    }

    if (password.length < 8) {
      return res.render('register', { message: 'Password must be at least 8 characters', messageType: 'error' });
    }

    if (!terms) {
      return res.render('register', { message: 'You must agree to the terms and conditions', messageType: 'error' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { message: 'User already exists with this email', messageType: 'error' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      phone: phone || '',
      password: hashedPassword
    });

    await newUser.save();

    res.render('register', { message: 'Registration successful! You can now login.', messageType: 'success' });

  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { message: 'An error occurred during registration', messageType: 'error' });
  }
});

module.exports = router;
