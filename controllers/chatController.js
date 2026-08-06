const Chat = require('../models/Chat');
const ChatSetting = require('../models/ChatSetting');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all closed chats (history)
// @route   GET /api/chats/history
// @access  Private/Admin
exports.getChatHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await Chat.countDocuments({ status: 'closed' });

  const chats = await Chat.find({ status: 'closed' })
    .populate('assignedTo', 'name email')
    .sort({ lastMessageAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    total,
    count: chats.length,
    data: chats
  });
});

// @desc    Get single chat details
// @route   GET /api/chats/:id
// @access  Private/Admin
exports.getChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id).populate('assignedTo', 'name email');

  if (!chat) {
    return next(new ErrorResponse(`Chat not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: chat
  });
});

// @desc    Get all unique categories from chats & settings
// @route   GET /api/chats/categories
// @access  Private/Admin
exports.getChatCategories = asyncHandler(async (req, res, next) => {
  // 1. Get categories already used in chats
  const usedCats = await Chat.distinct('category');
  
  // 2. Get categories defined in FAQ settings
  const settings = await ChatSetting.findOne({ key: 'visitor_faqs' });
  const definedCats = [];
  
  if (settings && settings.value) {
    const extract = (items) => {
      if (!Array.isArray(items)) return;
      items.forEach(item => {
        if (item && item.category) definedCats.push(item.category);
        if (item && item.followUps) extract(item.followUps);
      });
    };
    extract(settings.value);
  }

  // Combine, deduplicate, and filter
  const allCategories = [...new Set([...usedCats, ...definedCats])];
  const filtered = allCategories.filter(c => c && typeof c === 'string' && c.trim() !== '');
  
  res.status(200).json({
    success: true,
    data: filtered
  });
});
