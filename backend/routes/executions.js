const express = require('express');
const router = express.Router();
const Execution = require('../models/Execution');
const { protect, authorize } = require('../middleware/auth');
const executionController = require('../controllers/executionController');

router.use(protect);

// @route   GET /api/executions
// @desc    List executions
router.get('/', async (req, res) => {
  try {
    const { status, workflowId, page = 1, limit = 20, myOnly } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (workflowId) filter.workflowId = workflowId;

    // Non-admins only see their own or steps assigned to their role
    if (req.user.role !== 'admin') {
      if (myOnly === 'true' || req.user.role === 'user' || req.user.role === 'employee') {
        // Normal users and employees only see their own submissions
        filter.startedBy = req.user._id;
      } else {
        // Manager/finance see executions where their role has a step
        filter['steps.assignedRole'] = req.user.role;
      }
    }

    const skip = (page - 1) * limit;
    const executions = await Execution.find(filter)
      .populate('startedBy', 'name email role')
      .populate('workflowId', 'name version')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Execution.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: { executions, total, page: parseInt(page), totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/executions/:id
router.get('/:id', executionController.getExecution);

// @route   POST /api/executions/:id/action
// @desc    Approve or reject current step
router.post('/:id/action', executionController.processStepAction);

// @route   POST /api/executions/:id/cancel
router.post('/:id/cancel', executionController.cancelExecution);

// @route   POST /api/executions/:id/retry
router.post('/:id/retry', executionController.retryExecution);

module.exports = router;