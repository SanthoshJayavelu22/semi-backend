const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe to newsletter
 */
router.post('/subscribe', newsletterController.subscribe);

/**
 * @route   GET /api/newsletter
 * @desc    Get all subscribers (Admin)
 */
router.get('/', newsletterController.getAllSubscribers);

/**
 * @route   PUT /api/newsletter/unsubscribe
 * @desc    Unsubscribe from newsletter
 */
router.put('/unsubscribe', newsletterController.unsubscribe);

module.exports = router;
