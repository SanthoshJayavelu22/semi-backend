const express = require('express');
const { getChatSetting, updateChatSetting } = require('../controllers/chatSettingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:key', getChatSetting);
router.post('/', protect, authorize('admin', 'superadmin'), updateChatSetting);

module.exports = router;
