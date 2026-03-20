const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
  stepName: { type: String, required: true },
  nodeId: { type: String, default: null }, // React Flow node id
  workflowName: { type: String, default: '' },
  assignedRole: {
    type: String,
    enum: ['admin', 'manager', 'employee', 'finance', 'any'],
    required: true,
  },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'skipped', 'cancelled'],
    default: 'pending',
  },
  priority: { type: Number, default: 1 },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  decision: { type: String, enum: ['approved', 'rejected', 'skipped', null], default: null },
  reason: { type: String, default: '' },
  comment: { type: String, default: '' },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actionAt: { type: Date, default: null },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

taskSchema.index({ assignedRole: 1, status: 1 });
taskSchema.index({ executionId: 1 });

module.exports = mongoose.model('Task', taskSchema);