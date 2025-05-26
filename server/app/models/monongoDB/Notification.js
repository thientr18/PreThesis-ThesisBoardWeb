const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: Number, required: true },
  type: {
    type: String,
    enum: ['system', 'reminder', 'message', 'alert'],
    default: 'system'
  },
  title: { type: String },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date }
});

module.exports = mongoose.model('Notification', NotificationSchema);