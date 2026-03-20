const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  field: {
    type: String,
    required: true, // e.g. "amount", "department"
  },
  operator: {
    type: String,
    enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'skip', 'escalate', 'notify'],
    required: true,
  },
  // When rule matches, go to this step
  nextStepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Rule', ruleSchema);