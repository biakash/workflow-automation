const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'number', 'dropdown', 'date', 'file', 'email', 'textarea'],
    required: true,
  },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  min: { type: Number, default: null },
  max: { type: Number, default: null },
  order: { type: Number, default: 0 },
}, { _id: false });

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true,
  },
  description: { type: String, trim: true, default: '' },
  version: { type: String, default: 'v1' },
  versionNumber: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft',
  },
  category: {
    type: String,
    enum: ['approval', 'finance', 'hr', 'operations', 'loan', 'custom'],
    default: 'custom',
  },
  formSchema: { type: [formFieldSchema], default: [] },
  flowData: {
    nodes: { type: Array, default: [] },
    edges: { type: Array, default: [] },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentWorkflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    default: null,
  },
  tags: [{ type: String }],
}, { timestamps: true });

workflowSchema.index({ status: 1, createdBy: 1 });
workflowSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Workflow', workflowSchema);