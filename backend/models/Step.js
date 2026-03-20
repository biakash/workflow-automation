const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  field: { type: String, required: true },
  operator: {
    type: String,
    enum: [
      'equals', 'not_equals', 'greater_than', 'less_than',
      'greater_equal', 'less_equal', 'contains', 'not_contains',
      'not_empty', 'is_empty'
    ],
    required: true,
  },
  value: { type: mongoose.Schema.Types.Mixed, default: null },
  logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' },
}, { _id: false });

const stepSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  stepType: {
    type: String,
    enum: ['start', 'input', 'approval', 'condition', 'notification', 'action', 'task', 'decision', 'end'],
    default: 'approval',
  },
  nodeType: {
    type: String,
    enum: ['start', 'input', 'approval', 'condition', 'notification', 'action', 'task', 'decision', 'end'],
    default: 'task',
  },
  assignedRole: {
    type: String,
    enum: ['admin', 'manager', 'employee', 'finance', 'any'],
    default: 'any',
  },
  priority: { type: Number, required: true, min: 1 },
  conditions: { type: [conditionSchema], default: [] },
  onApprove: { type: String, default: 'next' },
  onReject: { type: String, default: 'stop' },
  rejectReason: {
    type: String,
    default: 'Does not meet eligibility criteria',
  },
  skipToStep: { type: Number, default: null },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  nodeId: { type: String, required: true },
  config: {
    requireComment: { type: Boolean, default: false },
    autoApprove: { type: Boolean, default: false },
    timeoutHours: { type: Number, default: null },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

stepSchema.index({ workflowId: 1, priority: 1 });

module.exports = mongoose.model('Step', stepSchema);