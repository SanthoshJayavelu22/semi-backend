const Newsletter = require('../models/Newsletter');
const asyncHandler = require('../utils/asyncHandler');

// @desc Subscribe to newsletter
// @route POST /api/newsletter/subscribe
exports.subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    const error = new Error('Please provide an email address');
    error.statusCode = 400;
    throw error;
  }

  // Check if already subscribed
  const existingSubscriber = await Newsletter.findOne({ email });
  if (existingSubscriber) {
    if (existingSubscriber.active) {
      const error = new Error('This email is already subscribed to our newsletter');
      error.statusCode = 400;
      throw error;
    } else {
      // Re-activate if previously unsubscribed
      existingSubscriber.active = true;
      await existingSubscriber.save();
      return res.status(200).json({
        success: true,
        message: 'Welcome back! Your subscription has been re-activated.'
      });
    }
  }

  const newSubscriber = await Newsletter.create({ email });

  res.status(201).json({
    success: true,
    message: 'Thank you for subscribing to our newsletter!',
    data: newSubscriber
  });
});

// @desc Get all subscribers (Admin)
// @route GET /api/newsletter
exports.getAllSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Newsletter.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: subscribers.length,
    data: subscribers
  });
});

// @desc Unsubscribe
// @route PUT /api/newsletter/unsubscribe
exports.unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const subscriber = await Newsletter.findOne({ email });
  if (!subscriber) {
    const error = new Error('Subscriber not found');
    error.statusCode = 404;
    throw error;
  }

  subscriber.active = false;
  await subscriber.save();

  res.status(200).json({
    success: true,
    message: 'You have been successfully unsubscribed from our newsletter.'
  });
});
