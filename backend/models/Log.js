const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  executionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Execution',
    required: true,
  },
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    default: null,
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

logSchema.index({ executionId: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);