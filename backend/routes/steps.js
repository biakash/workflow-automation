const express = require('express');
const router = express.Router();
const Step = require('../models/Step');
const Rule = require('../models/Rule');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @route   PUT /api/steps/:id
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const step = await Step.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!step) return res.status(404).json({ success: false, message: 'Step not found.' });
    return res.status(200).json({ success: true, data: { step } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   DELETE /api/steps/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const step = await Step.findByIdAndDelete(req.params.id);
    if (!step) return res.status(404).json({ success: false, message: 'Step not found.' });
    await Rule.deleteMany({ stepId: req.params.id });
    return res.status(200).json({ success: true, message: 'Step deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Rules sub-routes

// @route   POST /api/steps/:step_id/rules
router.post('/:step_id/rules', authorize('admin'), async (req, res) => {
  try {
    const step = await Step.findById(req.params.step_id);
    if (!step) return res.status(404).json({ success: false, message: 'Step not found.' });

    const rule = await Rule.create({ ...req.body, stepId: step._id });
    return res.status(201).json({ success: true, data: { rule } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/steps/:step_id/rules
router.get('/:step_id/rules', async (req, res) => {
  try {
    const rules = await Rule.find({ stepId: req.params.step_id });
    return res.status(200).json({ success: true, data: { rules } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;