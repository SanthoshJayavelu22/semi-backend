const mongoose = require('mongoose');

const ChatSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['visitor_faqs', 'admin_commands']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatSetting', ChatSettingSchema);
