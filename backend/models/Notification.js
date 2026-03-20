const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'manager', 'employee', 'finance', null],
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['approval_request', 'approval_done', 'rejection', 'workflow_complete', 'workflow_failed', 'info'],
    default: 'info',
  },
  executionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Execution',
    default: null,
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ recipientUser: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);