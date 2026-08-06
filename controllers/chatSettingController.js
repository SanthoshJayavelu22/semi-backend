const ChatSetting = require('../models/ChatSetting');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get chat settings by key
// @route   GET /api/chat-settings/:key
// @access  Public
exports.getChatSetting = asyncHandler(async (req, res, next) => {
  const setting = await ChatSetting.findOne({ key: req.params.key });

  if (!setting) {
    // Return default values if not found in DB
    let defaultValue = [];
    if (req.params.key === 'visitor_faqs') {
      defaultValue = [
        { label: 'Product Inquiry', value: 'I have an inquiry about your products.' },
        { label: 'Custom Order', value: 'I would like to discuss a custom order.' },
        { label: 'Technical Support', value: 'I need technical support help.' },
        { label: 'Pricing Info', value: 'Can you provide pricing information?' }
      ];
    }
    
    return res.status(200).json({
      success: true,
      data: defaultValue
    });
  }

  res.status(200).json({
    success: true,
    data: setting.value
  });
});

// @desc    Update chat settings
// @route   POST /api/chat-settings
// @access  Private/Admin
exports.updateChatSetting = asyncHandler(async (req, res, next) => {
  const { key, value } = req.body;

  let setting = await ChatSetting.findOne({ key });

  if (setting) {
    setting.value = value;
    await setting.save();
  } else {
    setting = await ChatSetting.create({ key, value });
  }

  res.status(200).json({
    success: true,
    data: setting.value
  });
});
