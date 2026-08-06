const express = require('express');
const router = express.Router();
const { getTemplates, updateTemplate, setDefaultTemplate } = require('../controllers/emailTemplateController');
const { protect, authorize } = require('../middleware/auth');

// Requires authentication and 'admin' role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/', getTemplates);
router.put('/:id', updateTemplate);
router.put('/:id/set-default', setDefaultTemplate);

module.exports = router;
