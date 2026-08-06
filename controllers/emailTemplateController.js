const EmailTemplate = require('../models/EmailTemplate');
const asyncHandler = require('../utils/asyncHandler');

// @desc Get all templates
// @route GET /api/templates
exports.getTemplates = asyncHandler(async (req, res) => {
  const templates = await EmailTemplate.find().sort({ name: 1 });
  
  // If no templates, create default 3
  if (templates.length === 0) {
    const defaultTemplates = [
      {
        name: 'Template 1',
        subject: 'Membership Application Approved - SEMI',
        content: `Dear {{name}},\n\nCongratulations! Your membership application for the Society for Emergency Medicine India (SEMI) has been approved.\n\nTo complete your membership process, please proceed with the payment using the link below:\n\n{{paymentLink}}\n\nBest Regards,\nSEMI Membership Team`,
        isDefault: true
      },
      {
        name: 'Template 2',
        subject: 'Membership Application Approved - SEMI',
        content: `Dear {{name}},\n\nWe are pleased to inform you that your membership application has been approved. Please use the link below to pay the fee:\n\n{{paymentLink}}\n\nSee you soon,\nSEMI Membership Team`,
        isDefault: false
      },
      {
        name: 'Template 3',
        subject: 'Action Required: Membership Application Approved',
        content: `Dear {{name}},\n\nYour SEMI membership is approved. Please pay here:\n\n{{paymentLink}}\n\nThanks,\nSEMI Team`,
        isDefault: false
      }
    ];
    await EmailTemplate.create(defaultTemplates);
    const newTemplates = await EmailTemplate.find();
    return res.status(200).json({ success: true, data: newTemplates });
  }

  res.status(200).json({ success: true, data: templates });
});

// @desc Update template
// @route PUT /api/templates/:id
exports.updateTemplate = asyncHandler(async (req, res) => {
  let template = await EmailTemplate.findById(req.params.id);
  
  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }

  template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: template });
});

// @desc Set default template
// @route PUT /api/templates/:id/set-default
exports.setDefaultTemplate = asyncHandler(async (req, res) => {
  await EmailTemplate.updateMany({}, { isDefault: false });
  const template = await EmailTemplate.findByIdAndUpdate(req.params.id, { isDefault: true }, { new: true });
  
  res.status(200).json({ success: true, data: template });
});
