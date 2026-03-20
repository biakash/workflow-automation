const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/signup
// @desc    Register new user (public - for self-signup)
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Account already exists. Please login.',
      });
    }

    // Create user with default 'user' role (normal public signup)
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Sign-up successful! Redirecting to login...',
      data: { user, token },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Special admin hardcoded credentials check
    if (email === 'admin@gmail.com' && password === 'admin123') {
      // Find or create admin user
      let adminUser = await User.findOne({ email: 'admin@gmail.com' });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'System Administrator',
          email: 'admin@gmail.com',
          password: 'admin123',
          role: 'admin',
        });
      }
      adminUser.lastLogin = new Date();
      await adminUser.save({ validateBeforeSave: false });

      const token = generateToken(adminUser._id);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user: adminUser, token },
      });
    }

    // Regular user lookup with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Contact your administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('createdBy', 'name email');
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout (client just removes token)
// @access  Private
router.post('/logout', protect, (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// @route   PATCH /api/auth/me
// @desc    Update own profile (name / password)
// @access  Private
router.patch('/me', protect, async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await require('../models/User').findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name && name.trim()) user.name = name.trim();
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      user.password = password; // pre-save hook hashes it
    }

    await user.save();
    return res.status(200).json({ success: true, message: 'Profile updated.', data: { user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;