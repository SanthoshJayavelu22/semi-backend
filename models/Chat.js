const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'admin', 'bot'], required: true },
  text: { type: String },
  timestamp: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false }
});

const chatSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, index: true }, // Socket ID or simple Fingerprint
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  status: { type: String, enum: ['active', 'closed', 'pending'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  category: { type: String, default: 'General Enquiry' },
  isLive: { type: Boolean, default: false },
  leadNotificationSent: { type: Boolean, default: false },
  messages: [messageSchema],
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
