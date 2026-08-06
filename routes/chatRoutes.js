const express = require('express');
const { getChatHistory, getChat, getChatCategories } = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/history', getChatHistory);
router.get('/categories', getChatCategories);
router.get('/:id', getChat);

module.exports = router;
