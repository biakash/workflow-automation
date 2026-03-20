const express = require('express');
const router = express.Router();
const Rule = require('../models/Rule');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @route   PUT /api/rules/:id
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found.' });
    return res.status(200).json({ success: true, data: { rule } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   DELETE /api/rules/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Rule deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;