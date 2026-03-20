const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Log = require('../models/Log');
const User = require('../models/User');
const {
  traverseFromNode,
  findStartNode,
  findNodeById,
  getNextNode,
  evaluateConditions,
  getNodeType,
} = require('../utils/graphEngine');

// ─── Log helper ───────────────────────────────────────────────────────────────
const createLog = async (executionId, message, level = 'info', actor = null) => {
  try { await Log.create({ executionId, message, level, actor }); }
  catch (e) { console.error('Log error:', e.message); }
};

// ─── Dynamic Notification Sender ──────────────────────────────────────────────
/**
 * sendNotif — unified notification creator
 * target: { userId } for user-based  OR  { role } for role-based
 */
const sendNotif = async ({ title, message, type = 'info', userId = null, role = null, executionId = null, workflowId = null }) => {
  try {
    await Notification.create({ title, message, type, recipientUser: userId, recipientRole: role, executionId, workflowId });
  } catch (e) { console.error('Notification error:', e.message); }
};

/**
 * notifyRole — sends a notification to ALL role-based recipients
 * Used for: task assigned, step approved → notify next role
 */
const notifyRole = async (role, title, message, type = 'info', executionId = null, workflowId = null) => {
  if (!role || role === 'any') return;
  await sendNotif({ title, message, type, role, executionId, workflowId });
};

/**
 * notifyUser — sends to the specific user who submitted the request
 */
const notifyUser = async (userId, title, message, type = 'info', executionId = null, workflowId = null) => {
  if (!userId) return;
  await sendNotif({ title, message, type, userId, executionId, workflowId });
};

/**
 * sendNotification — the main notification dispatch function
 * Called when a Notification node executes.
 * Supports recipientType: 'role' | 'requestUser'
 */
const sendNotification = async ({
  recipientType = 'requestUser',
  recipientRole = null,
  title,
  message,
  type = 'info',
  submittedByUserId,
  executionId,
  workflowId,
}) => {
  if (recipientType === 'role' && recipientRole) {
    await notifyRole(recipientRole, title, message, type, executionId, workflowId);
  } else {
    // Default: notify the user who submitted the form
    await notifyUser(submittedByUserId, title, message, type, executionId, workflowId);
  }
};

/**
 * interpolate — replace {{fieldId}} with actual form values
 */
const interpolate = (template = '', formData = {}) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, k) => formData[k] ?? `{{${k}}}`);

// ─── Task Creator ─────────────────────────────────────────────────────────────
const createTaskForNode = async (execution, node, workflowName) => {
  const d = node.data || {};
  return Task.create({
    executionId: execution._id,
    workflowId: execution.workflowId,
    stepId: null,
    stepName: d.label || getNodeType(node),
    workflowName,
    assignedRole: d.assignedRole || 'manager',
    formData: execution.formData,
    status: 'pending',
    priority: d.priority || 1,
    submittedBy: execution.startedBy,
    nodeId: node.id,
  });
};

// ─── Step Recorder — pushes audit step into execution.steps[] ─────────────────
/**
 * addStepRecord — adds a visual step to execution.steps[] for the progress tracker.
 * Called for every significant node traversed.
 */
const addStepRecord = (execution, node, status = 'completed', opts = {}) => {
  const { comment = '', reason = '', actionBy = null } = opts;
  const d = node?.data || {};
  const nodeType = (d.nodeType || d.stepType || 'task').toLowerCase();
  execution.steps.push({
    nodeId: node?.id || null,
    stepName: d.label || nodeType,
    nodeType,
    assignedRole: d.assignedRole || null,
    status,
    startTime: new Date(),
    endTime: ['completed', 'approved', 'rejected', 'skipped'].includes(status) ? new Date() : null,
    comment,
    reason,
    actionBy: actionBy || null,
    result: status === 'completed' ? 'approved' : status === 'rejected' ? 'rejected' : null,
  });
  execution.markModified('steps');
};

// ─── findFirstTaskRole — helper to find the first task node's assigned role ──
const findFirstTaskRole = (nodes, edges) => {
  const startNode = findStartNode(nodes);
  if (!startNode) return null;
  let current = startNode.id;
  const visited = new Set();
  for (let i = 0; i < 30; i++) {
    if (visited.has(current)) break;
    visited.add(current);
    const node = findNodeById(nodes, current);
    if (!node) break;
    const t = getNodeType(node);
    if (t === 'task' || t === 'approval') return node.data?.assignedRole || 'manager';
    const { nextNodeId } = getNextNode(current, edges);
    if (!nextNodeId) break;
    current = nextNodeId;
  }
  return null;
};

// ─── START EXECUTION ──────────────────────────────────────────────────────────
exports.startExecution = async (req, res) => {
  try {
    const workflowId = req.params.workflow_id;
    const { formData = {}, priority = 'normal' } = req.body;

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });
    if (workflow.status !== 'active') return res.status(400).json({ success: false, message: 'Workflow is not active.' });

    const nodes = workflow.flowData?.nodes || [];
    const edges = workflow.flowData?.edges || [];

    if (nodes.length === 0) return res.status(400).json({ success: false, message: 'Workflow has no flow nodes. Build the flow first.' });

    // Validate required fields
    for (const field of workflow.formSchema) {
      const val = formData[field.fieldId];
      if (field.required && (val === undefined || val === '' || val === null)) {
        return res.status(400).json({ success: false, message: `Required field missing: ${field.label}` });
      }
    }

    const startNode = findStartNode(nodes);
    if (!startNode) return res.status(400).json({ success: false, message: 'No Start node found in the flow.' });

    // Run graph traversal to find where we land
    const traversal = traverseFromNode(startNode.id, nodes, edges, formData);

    // ── HARD REJECTION (condition fails, no FALSE path) ──
    if (traversal.status === 'rejected') {
      return res.status(200).json({
        success: false, rejected: true,
        message: traversal.rejectedReason,
        failedField: traversal.failedCondition?.field || null,
      });
    }

    // Create execution record with steps pre-populated from node history
    const execution = await Execution.create({
      workflowId: workflow._id, workflowName: workflow.name,
      workflowVersion: workflow.version,
      startedBy: req.user._id,
      status: 'running', formData, priority,
      currentNodeId: traversal.currentNodeId,
      nodeHistory: traversal.nodeHistory || [],
      steps: [],
    });

    // ── Record steps for every node that was auto-traversed ──
    for (const histItem of (traversal.nodeHistory || [])) {
      const node = findNodeById(nodes, histItem.nodeId);
      if (!node) continue;
      const t = histItem.nodeType;
      if (t === 'task' || t === 'approval' || t === 'decision') {
        // Task nodes start as 'pending'
        addStepRecord(execution, node, 'pending');
      } else {
        // All auto-advance nodes (start, input, condition pass, notification, end) = completed
        addStepRecord(execution, node, 'completed');
      }
    }

    await createLog(execution._id, `Execution started by ${req.user.name}`, 'info', req.user._id);

    // ── NOTIFICATION 1: Workflow starts → notify FIRST assigned role ──
    const firstRole = findFirstTaskRole(nodes, edges);
    if (firstRole) {
      await notifyRole(firstRole,
        `📋 New ${workflow.name} Request`,
        `${req.user.name} submitted a new request that requires your review.`,
        'approval_request', execution._id, workflow._id);
    }

    // Process traversal result
    await _handleTraversalResult(traversal, execution, nodes, edges, workflow, req);

    execution.markModified('nodeHistory');
    execution.markModified('steps');
    await execution.save();

    return res.status(201).json({ success: true, message: 'Request submitted!', data: { execution } });
  } catch (error) {
    console.error('startExecution error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Internal: handle a traversal result (shared by start + approve) ─────────
async function _handleTraversalResult(traversal, execution, nodes, edges, workflow, req) {
  const wfId = workflow._id || workflow;
  const wfName = workflow.name || execution.workflowName;

  if (traversal.status === 'notification') {
    await _handleNotificationNode(traversal, execution, nodes, edges, workflow, req);
    return;
  }

  if (traversal.status === 'task_created') {
    const taskNode = findNodeById(nodes, traversal.taskNodeId);
    if (taskNode) {
      await createTaskForNode(execution, taskNode, wfName);
      const role = taskNode.data?.assignedRole;
      // ── NOTIFICATION 2: Task assigned → notify role ──
      if (role && role !== 'any') {
        await notifyRole(role,
          `📋 Action Required: ${wfName}`,
          `A new step "${taskNode.data?.label || 'Task'}" is waiting for your action.`,
          'approval_request', execution._id, wfId);
      }
      await createLog(execution._id, `Task "${taskNode.data?.label}" created → ${role}`, 'info', req?.user?._id);
    }
  }

  if (traversal.status === 'completed') {
    execution.status = 'completed';
    execution.endTime = new Date();
    // ── NOTIFICATION 5: Completed → notify request user ──
    await notifyUser(execution.startedBy,
      `✅ ${wfName} Approved`,
      `Your request has been approved and completed successfully.`,
      'workflow_complete', execution._id, wfId);
    await createLog(execution._id, 'Workflow completed!', 'success', req?.user?._id);
  }

  if (traversal.status === 'rejected') {
    execution.status = 'rejected';
    execution.endTime = new Date();
    execution.rejectionReason = traversal.rejectedReason;
    // ── NOTIFICATION 4: Rejected → notify request user ──
    await notifyUser(execution.startedBy,
      `❌ ${wfName} Rejected`,
      traversal.rejectedReason || 'Your request was rejected.',
      'rejection', execution._id, wfId);
  }
}

async function _handleNotificationNode(traversal, execution, nodes, edges, workflow, req) {
  const nd = traversal.notificationData || {};
  const msg = interpolate(nd.message || '', execution.formData);
  const wfId = workflow._id || workflow;
  const wfName = workflow.name || execution.workflowName;

  // ── Send notification using configurable recipient ──
  const recipientType = traversal.notifRecipientType || 'requestUser';
  const recipientRole = traversal.notifRecipientRole || null;

  await sendNotification({
    recipientType,
    recipientRole,
    title: nd.title || 'Notification',
    message: msg,
    type: nd.type || 'info',
    submittedByUserId: execution.startedBy,
    executionId: execution._id,
    workflowId: wfId,
  });

  await createLog(execution._id, `Notification sent: "${nd.title}" → ${recipientType === 'role' ? recipientRole : 'requester'}`, 'info', req?.user?._id);

  // Continue traversal from after the notification node
  if (traversal.nextNodeId) {
    const cont = traverseFromNode(traversal.nextNodeId, nodes, edges, execution.formData);

    // Record steps for nodes traversed in continuation
    for (const histItem of (cont.nodeHistory || [])) {
      const node = findNodeById(nodes, histItem.nodeId);
      if (!node) continue;
      const t = histItem.nodeType;
      if (t === 'task' || t === 'approval' || t === 'decision') {
        addStepRecord(execution, node, 'pending');
      } else {
        addStepRecord(execution, node, 'completed');
      }
    }

    execution.nodeHistory = [...(execution.nodeHistory || []), ...(cont.nodeHistory || [])];
    execution.currentNodeId = cont.currentNodeId;
    await _handleTraversalResult(cont, execution, nodes, edges, workflow, req);
  } else {
    execution.status = 'completed';
    execution.endTime = new Date();
    await notifyUser(execution.startedBy, `✅ ${wfName} Completed`, `Your request is complete.`, 'workflow_complete', execution._id, wfId);
  }
}

// ─── GET EXECUTION ────────────────────────────────────────────────────────────
exports.getExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id)
      .populate('startedBy', 'name email role')
      .populate('workflowId', 'name version formSchema flowData');

    if (!execution) return res.status(404).json({ success: false, message: 'Execution not found.' });

    const logs = await Log.find({ executionId: execution._id }).sort({ createdAt: 1 });
    const tasks = await Task.find({ executionId: execution._id }).populate('actionBy', 'name email').sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: { execution, logs, tasks } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PROCESS TASK ACTION (Approve / Reject) ───────────────────────────────────
exports.processStepAction = async (req, res) => {
  try {
    const { action, comment, reason, branch } = req.body;

    const execution = await Execution.findById(req.params.id)
      .populate('workflowId', 'name flowData');

    if (!execution) return res.status(404).json({ success: false, message: 'Execution not found.' });
    if (execution.status !== 'running') return res.status(400).json({ success: false, message: `Execution is already ${execution.status}.` });

    const workflow = execution.workflowId;
    const nodes = workflow?.flowData?.nodes || [];
    const edges = workflow?.flowData?.edges || [];
    const wfId = workflow?._id;
    const wfName = execution.workflowName;

    const currentNode = findNodeById(nodes, execution.currentNodeId);
    const currentNodeType = currentNode ? getNodeType(currentNode) : 'task';

    // Role auth check — only the assigned role (or admin) can act
    const expectedRole = currentNode?.data?.assignedRole;
    if (expectedRole && expectedRole !== 'any' && expectedRole !== req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: `Only ${expectedRole} can act on this step.` });
    }

    // Mark task as done
    await Task.findOneAndUpdate(
      { executionId: execution._id, nodeId: execution.currentNodeId, status: 'pending' },
      { status: action === 'approved' ? 'approved' : 'rejected', decision: action, comment: comment || '', reason: reason || '', actionBy: req.user._id, actionAt: new Date() }
    );

    // ── Update the step record for the current (task) node ──
    const stepIdx = execution.steps.findIndex(
      s => s.nodeId === execution.currentNodeId && s.status === 'pending'
    );
    if (stepIdx !== -1) {
      execution.steps[stepIdx].status = action === 'approved' ? 'completed' : 'rejected';
      execution.steps[stepIdx].endTime = new Date();
      execution.steps[stepIdx].comment = comment || '';
      execution.steps[stepIdx].reason = reason || '';
      execution.steps[stepIdx].actionBy = req.user._id;
      execution.steps[stepIdx].result = action === 'approved' ? 'approved' : 'rejected';
      execution.markModified('steps');
    }

    await createLog(execution._id,
      `"${currentNode?.data?.label || 'Step'}" ${action} by ${req.user.name}${reason ? ` | Reason: ${reason}` : ''}`,
      action === 'approved' ? 'success' : 'warning', req.user._id);

    // ── REJECTED ──
    if (action === 'rejected') {
      execution.status = 'rejected';
      execution.endTime = new Date();
      execution.rejectionReason = reason || comment || `Rejected at "${currentNode?.data?.label}" by ${req.user.name}`;
      execution.rejectedAt = currentNode?.data?.label;

      await Task.updateMany({ executionId: execution._id, status: 'pending' }, { status: 'cancelled' });

      // ── NOTIFICATION 4: Rejected → notify request user ──
      await notifyUser(execution.startedBy,
        `❌ ${wfName} Rejected`,
        `Your request was rejected at "${currentNode?.data?.label}" by ${req.user.name}.${reason ? ` Reason: ${reason}` : ''}`,
        'rejection', execution._id, wfId);

      execution.markModified('steps');
      await execution.save();
      return res.status(200).json({ success: true, message: 'Step rejected.', data: { execution } });
    }

    // ── APPROVED — continue graph ──
    const decisionHandle = currentNodeType === 'decision' ? (branch || 'approved') : null;
    const { nextNodeId } = getNextNode(execution.currentNodeId, edges, decisionHandle);

    if (!nextNodeId) {
      // No next node = complete
      execution.status = 'completed';
      execution.endTime = new Date();
      await notifyUser(execution.startedBy, `✅ ${wfName} Approved`, `Your request has been fully approved and completed.`, 'workflow_complete', execution._id, wfId);
      await createLog(execution._id, 'Workflow completed!', 'success', req.user._id);
      execution.markModified('steps');
      await execution.save();
      return res.status(200).json({ success: true, message: 'Workflow completed!', data: { execution } });
    }

    // Traverse from next node
    const traversal = traverseFromNode(nextNodeId, nodes, edges, execution.formData);

    // ── Record steps for newly traversed nodes ──
    for (const histItem of (traversal.nodeHistory || [])) {
      const node = findNodeById(nodes, histItem.nodeId);
      if (!node) continue;
      const t = histItem.nodeType;
      if (t === 'task' || t === 'approval' || t === 'decision') {
        addStepRecord(execution, node, 'pending');
      } else {
        addStepRecord(execution, node, 'completed');
      }
    }

    execution.nodeHistory = [...(execution.nodeHistory || []), ...(traversal.nodeHistory || [])];
    execution.currentNodeId = traversal.currentNodeId;
    execution.markModified('nodeHistory');
    execution.markModified('steps');

    // ── NOTIFICATION 3: Approved → notify NEXT assigned role ──
    if (traversal.status === 'task_created') {
      const nextTaskNode = findNodeById(nodes, traversal.taskNodeId);
      const nextRole = nextTaskNode?.data?.assignedRole;
      if (nextRole && nextRole !== currentNode?.data?.assignedRole) {
        await notifyRole(nextRole,
          `📋 Action Required: ${wfName}`,
          `${req.user.name} approved their step. Now "${nextTaskNode?.data?.label || 'Task'}" requires your action.`,
          'approval_request', execution._id, wfId);
      }
    }

    await _handleTraversalResult(traversal, execution, nodes, edges, workflow, req);

    execution.markModified('steps');
    await execution.save();
    return res.status(200).json({ success: true, message: 'Step approved.', data: { execution } });
  } catch (error) {
    console.error('processStepAction error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── CANCEL EXECUTION ─────────────────────────────────────────────────────────
exports.cancelExecution = async (req, res) => {
  try {
    const { reason } = req.body;
    const execution = await Execution.findById(req.params.id);

    if (!execution) return res.status(404).json({ success: false, message: 'Execution not found.' });
    if (!['running', 'pending'].includes(execution.status)) return res.status(400).json({ success: false, message: 'Cannot cancel this execution.' });
    if (req.user.role !== 'admin' && execution.startedBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });

    execution.status = 'cancelled';
    execution.endTime = new Date();
    execution.cancelReason = reason || 'Cancelled by user';

    await Task.updateMany({ executionId: execution._id, status: 'pending' }, { status: 'cancelled' });
    await execution.save();
    await createLog(execution._id, `Cancelled by ${req.user.name}`, 'warning', req.user._id);

    return res.status(200).json({ success: true, message: 'Execution cancelled.', data: { execution } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── RETRY EXECUTION ──────────────────────────────────────────────────────────
exports.retryExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id).populate('workflowId', 'name flowData');

    if (!execution) return res.status(404).json({ success: false, message: 'Execution not found.' });
    if (!['failed', 'rejected'].includes(execution.status)) return res.status(400).json({ success: false, message: 'Only failed/rejected can be retried.' });
    if (req.user.role !== 'admin' && execution.startedBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const nodes = execution.workflowId?.flowData?.nodes || [];
    const edges = execution.workflowId?.flowData?.edges || [];

    const traversal = traverseFromNode(execution.currentNodeId, nodes, edges, execution.formData);
    execution.status = 'running';
    execution.errorMessage = null;
    execution.rejectionReason = null;
    execution.currentNodeId = traversal.currentNodeId;
    execution.nodeHistory = [...(execution.nodeHistory || []), ...(traversal.nodeHistory || [])];

    // Record steps for retry traversal
    for (const histItem of (traversal.nodeHistory || [])) {
      const node = findNodeById(nodes, histItem.nodeId);
      if (!node) continue;
      const t = histItem.nodeType;
      if (t === 'task' || t === 'approval' || t === 'decision') {
        addStepRecord(execution, node, 'pending');
      } else {
        addStepRecord(execution, node, 'completed');
      }
    }

    await _handleTraversalResult(traversal, execution, nodes, edges, execution.workflowId, req);
    execution.markModified('nodeHistory');
    execution.markModified('steps');
    await execution.save();

    await createLog(execution._id, `Retry by ${req.user.name}`, 'info', req.user._id);
    return res.status(200).json({ success: true, message: 'Retry initiated.', data: { execution } });
  } catch (error) {
    console.error('retryExecution error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};