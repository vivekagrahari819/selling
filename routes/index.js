const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Pages
router.get('/', (req, res) => res.render('index'));
router.get('/about', (req, res) => res.render('about'));
router.get('/contact', (req, res) => res.render('contact'));
router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.render('register', { message: 'All fields are required', messageType: 'error' });
    }
    if (password !== confirmPassword) {
      return res.render('register', { message: 'Passwords do not match', messageType: 'error' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { message: 'User already exists', messageType: 'error' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, phone, password: hashedPassword });
    await newUser.save();

    res.render('login', { message: 'Registration successful! Please login.', messageType: 'success' });

  } catch (err) {
    console.error(err);
    res.render('register', { message: 'Error during registration', messageType: 'error' });
  }
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { message: 'Invalid email or password', messageType: 'error' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { message: 'Invalid email or password', messageType: 'error' });
    }

    // Store user in session
    req.session.user = { name: user.fullName, email: user.email };

    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { message: 'An error occurred', messageType: 'error' });
  }
});

module.exports = router;
