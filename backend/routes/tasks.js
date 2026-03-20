const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const executionController = require('../controllers/executionController');

router.use(protect);

// GET /api/tasks?status=pending
router.get('/', async (req, res) => {
  try {
    const { role, status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'admin') {
      if (role) filter.assignedRole = role;
    } else {
      filter.assignedRole = req.user.role;
    }

    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const tasks = await Task.find(filter)
      .populate('submittedBy', 'name email')
      .populate('actionBy', 'name email')
      .populate('workflowId', 'name version formSchema')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        tasks,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('workflowId', 'name version formSchema')
      .populate('executionId', 'executionId status steps formData');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    return res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/tasks/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Task is already ${task.status}.` });
    }

    if (task.assignedRole !== req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this task.' });
    }

    req.params.id = task.executionId.toString();
    req.body.action = 'approved';

    return await executionController.processStepAction(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/tasks/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Task is already ${task.status}.` });
    }

    if (task.assignedRole !== req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this task.' });
    }

    req.params.id = task.executionId.toString();
    req.body.action = 'rejected';

    return await executionController.processStepAction(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;