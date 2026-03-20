const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const stepExecutionSchema = new mongoose.Schema({
  nodeId: { type: String, default: null },   // React Flow node id
  stepName: { type: String, default: '' },
  nodeType: { type: String, default: 'task' },
  assignedRole: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'running', 'approved', 'completed', 'failed', 'rejected', 'skipped', 'cancelled'],
    default: 'pending',
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  comment: { type: String, default: '' },
  reason: { type: String, default: '' },
  result: { type: String, enum: ['approved', 'rejected', 'skipped', 'auto_approved', null], default: null },
});

const nodeHistorySchema = new mongoose.Schema({
  nodeId: { type: String },
  nodeType: { type: String },
  label: { type: String },
  enteredAt: { type: Date, default: Date.now },
}, { _id: false });

const executionSchema = new mongoose.Schema({
  executionId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
  },
  workflowName: String,
  workflowVersion: String,
  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'cancelled', 'pending', 'rejected'],
    default: 'pending',
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  currentStepIndex: { type: Number, default: 0 },
  currentNodeId: { type: String, default: null },   // Graph: current React Flow node id
  nodeHistory: { type: [nodeHistorySchema], default: [] }, // Graph: traversal audit trail
  steps: [stepExecutionSchema],
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  errorMessage: { type: String, default: null },
  cancelReason: { type: String, default: null },
  rejectionReason: { type: String, default: null },
  rejectedAt: { type: String, default: null },
}, { timestamps: true });

executionSchema.index({ workflowId: 1, status: 1 });
executionSchema.index({ startedBy: 1 });

module.exports = mongoose.model('Execution', executionSchema);