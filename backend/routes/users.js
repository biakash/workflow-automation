const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/users
// @desc    Get all users (admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: { users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/users
// @desc    Create user (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { user },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('createdBy', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { name, role, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // pre-save hook will hash it

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/users/:id/toggle-status
// @desc    Activate/Deactivate user
router.patch('/:id/toggle-status', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;