const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ─── Helper: Extract steps from React Flow nodes ──────────────────────────────
const extractStepsFromNodes = async (workflowId, nodes) => {
  // Delete old steps first
  await Step.deleteMany({ workflowId });

  if (!nodes || nodes.length === 0) return [];

  // Sort nodes by priority (from node data) or by x position
  const sortedNodes = [...nodes].sort((a, b) => {
    const pa = a.data?.priority || a.position?.x || 0;
    const pb = b.data?.priority || b.position?.x || 0;
    return pa - pb;
  });

  const steps = [];

  for (let i = 0; i < sortedNodes.length; i++) {
    const node = sortedNodes[i];
    const data = node.data || {};

    const step = await Step.create({
      workflowId,
      name: data.label || `Step ${i + 1}`,
      description: data.description || '',
      stepType: data.stepType || 'approval',
      assignedRole: data.assignedRole || 'any',
      priority: data.priority || i + 1,
      conditions: data.conditions || [],
      onApprove: data.onApprove || 'next',
      onReject: data.onReject || 'stop',
      rejectReason: data.rejectReason || 'Does not meet eligibility criteria',
      skipToStep: data.skipToStep || null,
      position: node.position || { x: 0, y: 0 },
      nodeId: node.id,
      config: {
        requireComment: data.requireComment || false,
        autoApprove: data.autoApprove || false,
        timeoutHours: data.timeoutHours || null,
      },
    });

    steps.push(step);
  }

  return steps;
};

// ─── GET /api/workflows ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Non-admins only see active workflows
    if (req.user.role !== 'admin') {
      filter.status = 'active';
    } else {
      if (status) filter.status = status;
    }

    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const workflows = await Workflow.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Workflow.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        workflows,
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

// ─── POST /api/workflows ──────────────────────────────────────────────────────
// Creates workflow + extracts steps from React Flow nodes dynamically
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      tags,
      status,
      formSchema,
      flowData,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name is required.',
      });
    }

    // Create workflow
    const workflow = await Workflow.create({
      name,
      description: description || '',
      category: category || 'custom',
      tags: tags || [],
      status: status || 'draft',
      formSchema: formSchema || [],
      flowData: flowData || { nodes: [], edges: [] },
      createdBy: req.user._id,
      version: 'v1',
      versionNumber: 1,
    });

    // Extract and create steps from nodes automatically
    const nodes = flowData?.nodes || [];
    const steps = await extractStepsFromNodes(workflow._id, nodes);

    return res.status(201).json({
      success: true,
      message: `Workflow created with ${steps.length} step(s).`,
      data: { workflow, steps },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/workflows/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    const steps = await Step.find({ workflowId: workflow._id }).sort({ priority: 1 });

    return res.status(200).json({
      success: true,
      data: { workflow, steps },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/workflows/:id ───────────────────────────────────────────────────
// Updates workflow + re-extracts steps from updated nodes
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      tags,
      flowData,
      status,
      formSchema,
      createNewVersion,
    } = req.body;

    const existing = await Workflow.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    if (createNewVersion) {
      const nv = existing.versionNumber + 1;

      const newWorkflow = await Workflow.create({
        name: name || existing.name,
        description: description || existing.description,
        category: category || existing.category,
        tags: tags || existing.tags,
        flowData: flowData || existing.flowData,
        formSchema: formSchema || existing.formSchema,
        createdBy: req.user._id,
        version: `v${nv}`,
        versionNumber: nv,
        parentWorkflow: existing._id,
      });

      // Extract steps for new version
      const nodes = flowData?.nodes || existing.flowData?.nodes || [];
      const steps = await extractStepsFromNodes(newWorkflow._id, nodes);

      return res.status(201).json({
        success: true,
        message: `New version v${nv} created with ${steps.length} step(s).`,
        data: { workflow: newWorkflow, steps },
      });
    }

    // Update in place
    if (name) existing.name = name;
    if (description !== undefined) existing.description = description;
    if (category) existing.category = category;
    if (tags) existing.tags = tags;
    if (status) existing.status = status;
    if (formSchema) existing.formSchema = formSchema;

    if (flowData) {
      existing.flowData = flowData;

      // Re-extract steps from updated nodes
      const nodes = flowData.nodes || [];
      await extractStepsFromNodes(existing._id, nodes);
    }

    await existing.save();

    const steps = await Step.find({ workflowId: existing._id }).sort({ priority: 1 });

    return res.status(200).json({
      success: true,
      message: 'Workflow updated.',
      data: { workflow: existing, steps },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/workflows/:id/status ─────────────────────────────────────────
router.patch('/:id/status', authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    // Check if workflow has steps before activating
    if (status === 'active') {
      const stepCount = await Step.countDocuments({ workflowId: workflow._id });
      if (stepCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot activate workflow with no steps. Build the flow first.',
        });
      }
    }

    workflow.status = status;
    await workflow.save();

    return res.status(200).json({
      success: true,
      message: `Workflow ${status}.`,
      data: { workflow },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/workflows/:id ────────────────────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const workflow = await Workflow.findByIdAndDelete(req.params.id);

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    await Step.deleteMany({ workflowId: req.params.id });

    return res.status(200).json({ success: true, message: 'Workflow deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/workflows/:id/form-schema ─────────────────────────────────────
// Save form schema separately
router.post('/:id/form-schema', authorize('admin'), async (req, res) => {
  try {
    const { formSchema } = req.body;

    if (!Array.isArray(formSchema)) {
      return res.status(400).json({ success: false, message: 'formSchema must be an array.' });
    }

    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    workflow.formSchema = formSchema;
    await workflow.save();

    return res.status(200).json({
      success: true,
      message: `Form schema saved with ${formSchema.length} field(s).`,
      data: { workflow },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/workflows/:id/flow-data ───────────────────────────────────────
// Save React Flow data + re-extract steps dynamically
router.post('/:id/flow-data', authorize('admin'), async (req, res) => {
  try {
    const { nodes, edges } = req.body;

    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    // Save flow data
    workflow.flowData = { nodes: nodes || [], edges: edges || [] };
    await workflow.save();

    // Re-extract steps from nodes dynamically
    const steps = await extractStepsFromNodes(workflow._id, nodes || []);

    return res.status(200).json({
      success: true,
      message: `Flow saved. ${steps.length} step(s) extracted from nodes.`,
      data: { workflow, steps },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/workflows/:workflow_id/steps ────────────────────────────────────
router.get('/:workflow_id/steps', async (req, res) => {
  try {
    const steps = await Step.find({ workflowId: req.params.workflow_id }).sort({ priority: 1 });
    return res.status(200).json({ success: true, data: { steps } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/workflows/:workflow_id/steps ───────────────────────────────────
// Manually add a single step (optional)
router.post('/:workflow_id/steps', authorize('admin'), async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.workflow_id);

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    const {
      name, description, stepType, assignedRole,
      priority, position, nodeId, config,
      conditions, onApprove, onReject, rejectReason, skipToStep,
    } = req.body;

    if (!name || !priority || !nodeId) {
      return res.status(400).json({
        success: false,
        message: 'name, priority, and nodeId are required.',
      });
    }

    const step = await Step.create({
      workflowId: workflow._id,
      name,
      description,
      stepType,
      assignedRole,
      priority,
      position,
      nodeId,
      config,
      conditions: conditions || [],
      onApprove: onApprove || 'next',
      onReject: onReject || 'stop',
      rejectReason: rejectReason || '',
      skipToStep: skipToStep || null,
    });

    return res.status(201).json({ success: true, data: { step } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/workflows/:workflow_id/execute ─────────────────────────────────
// Triggers execution engine — only 'user' and 'employee' roles can submit
router.post('/:workflow_id/execute', authorize('user', 'employee', 'admin'), async (req, res) => {
  try {
    const executionController = require('../controllers/executionController');
    return await executionController.startExecution(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;