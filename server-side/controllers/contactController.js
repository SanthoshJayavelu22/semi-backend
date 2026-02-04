const sendEmail = require('../utils/emailSender');
const asyncHandler = require('../utils/asyncHandler');
const { getAdminEmailTemplate, getUserAutoReplyTemplate } = require('../utils/emailTemplates');

exports.submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  try {
    // 1. Send Email to Admin/Head Office
    await sendEmail({
      to: process.env.ADMIN_EMAILS,
      subject: `New Contact Inquiry: ${subject}`,
      html: getAdminEmailTemplate({ name, email, phone, subject, message }),
    });

    // 2. Send Auto-reply to User
    await sendEmail({
      to: email,
      subject: 'We received your message - SEMI',
      html: getUserAutoReplyTemplate(name, subject),
    });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500);
    throw new Error('Email could not be sent');
  }
});
