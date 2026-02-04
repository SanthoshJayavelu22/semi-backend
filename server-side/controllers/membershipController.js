const Membership = require('../models/Membership');
const asyncHandler = require('../utils/asyncHandler');
const { deleteFiles, deleteSingleFile } = require('../utils/fileManager');

// @desc Create a new membership application
// @route POST /api/membership
exports.createMembership = asyncHandler(async (req, res) => {
  const formData = req.body;
  const files = req.files || {};

  // Map file paths to formData cleanly
  // Map file paths to formData cleanly
  const fileFields = ['photograph', 'mciFile', 'pgFile', 'otherDocs'];
  fileFields.forEach(field => {
    if (files[field]) {
       if (field === 'otherDocs') {
          // Handle multiple files for otherDocs
          formData[field] = files[field].map(file => file.path.replace(/\\/g, '/'));
       } else {
          // Handle single files
          formData[field] = files[field][0].path.replace(/\\/g, '/');
       }
    }
  });

  const newMembership = await Membership.create(formData);

  // Send response immediately to avoid waiting for email
  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: newMembership
  });

  // --- Send Email Notification (Background Process) ---
  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // --- Premium Email Design V4 (Elegant) ---
    const colors = {
      primary: '#2563eb', // Blue 600
      primaryDark: '#1e40af', // Blue 800
      bg: '#f8fafc', // Slate 50
      card: '#ffffff',
      textMain: '#1e293b', // Slate 800
      textMuted: '#64748b', // Slate 500
      border: '#e2e8f0' // Slate 200
    };

    const styles = {
      body: `margin: 0; padding: 0; background-color: ${colors.bg}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;`,
      wrapper: 'max-width: 640px; margin: 0 auto; padding: 40px 20px;',
      card: `background-color: ${colors.card}; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid ${colors.border};`,
      header: `background-color: ${colors.primary}; padding: 32px 40px; text-align: center;`,
      headerTitle: 'color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;',
      headerSubtitle: 'color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 14px; font-weight: 400;',
      content: 'padding: 40px;',
      greeting: `font-size: 18px; color: ${colors.textMain}; margin-bottom: 24px; font-weight: 600;`,
      intro: `color: ${colors.textMain}; line-height: 1.6; margin-bottom: 32px; font-size: 16px;`,
      sectionHeader: `display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid ${colors.primary}; padding-bottom: 8px;`,
      sectionTitle: `font-size: 16px; color: ${colors.primaryDark}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0;`,
      table: 'width: 100%; border-collapse: separate; border-spacing: 0;',
      tdLabel: `padding: 12px 0; border-bottom: 1px solid ${colors.border}; font-weight: 600; color: ${colors.textMuted}; font-size: 14px; width: 35%; vertical-align: top;`,
      tdValue: `padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMain}; font-size: 15px; width: 65%; vertical-align: top;`,
      attachmentBox: `background-color: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 6px; padding: 16px; display: flex; align-items: center; margin-top: 32px;`,
      attachmentIcon: `font-size: 20px; margin-right: 12px;`,
      attachmentText: `color: ${colors.textMain}; font-size: 14px; margin: 0; font-weight: 500;`,
      footer: `background-color: ${colors.bg}; padding: 24px; text-align: center; color: ${colors.textMuted}; font-size: 13px; border-top: 1px solid ${colors.border}; line-height: 1.5;`,
    };

    let tableRows = '';

    // Create a copy of formData for email purposess to avoid mutating actual DB data if we were using it later (though we already saved)
    // We want to sanitize the display based on logic:
    // If MBBS -> Other fields N/A
    // If Other -> MBBS fields N/A
    const mailData = { ...formData };
    
    if (mailData.qualificationType === 'MBBS') {
        mailData.otherDegree = 'N/A';
    } else if (mailData.qualificationType === 'Other') {
        mailData.mbbsCollege = 'N/A';
        mailData.mbbsYear = 'N/A';
    }

    // Explicit order or logic if needed, but iterating entries is fine if we skip system keys
    for (const [key, value] of Object.entries(mailData)) {
      if (!fileFields.includes(key) && key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
         // Format key for better readability
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        // Ensure empty values show as "-" or kept as is? User wants "N/A" for specific cases which we handled above.
        // For other empty fields, let's keep them as is or show meaningful text?
        // Let's stick to the specific requirement for now.
        
         tableRows += `
          <tr>
            <td style="${styles.tdLabel}">${formattedKey}</td>
            <td style="${styles.tdValue}">${value || '-'}</td>
          </tr>
        `;
      }
    }

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="${styles.body}">
        <div style="${styles.wrapper}">
          <div style="${styles.card}">
            <div style="${styles.header}">
              <h1 style="${styles.headerTitle}">Membership Application</h1>
              <p style="${styles.headerSubtitle}">New submission via Portal</p>
            </div>
            
            <div style="${styles.content}">
              <div style="${styles.greeting}">Hello Admin,</div>
              <div style="${styles.intro}">
                A new membership request has been newly submitted. Please review the details provided below.
              </div>
              
              <div style="${styles.sectionHeader}">
                <h2 style="${styles.sectionTitle}">Applicant Details</h2>
              </div>
              
              <table style="${styles.table}">
                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              <div style="${styles.attachmentBox}">
                <span style="${styles.attachmentIcon}">📎</span>
                <p style="${styles.attachmentText}">
                  Files have been attached to this email.
                </p>
              </div>
            </div>
            
            <div style="${styles.footer}">
              &copy; ${new Date().getFullYear()}Semi.<br>
              Automated Notification Service.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments
    const attachments = [];
    fileFields.forEach(field => {
      if (files[field] && files[field].length > 0) {
        // Add all files for this field
        files[field].forEach(file => {
             attachments.push({
                path: file.path
             });
        });
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAILS, 
      subject: 'New Membership Application Submission',
      html: emailBody,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

  } catch (emailError) {
    console.error('Error sending email:', emailError);
    // Email failed but user already got success response. 
    // Ideally we might want to log this to a monitoring service.
  }
});

// @desc Get all applications
// @route GET /api/membership
exports.getAllMemberships = asyncHandler(async (req, res) => {
  const memberships = await Membership.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: memberships.length, data: memberships });
});

// @desc Get single application
// @route GET /api/membership/:id
exports.getMembershipById = asyncHandler(async (req, res) => {
  const membership = await Membership.findById(req.params.id);
  
  if (!membership) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }
  
  res.status(200).json({ success: true, data: membership });
});

// @desc Update application
// @route PUT /api/membership/:id
exports.updateMembership = asyncHandler(async (req, res) => {
  let membership = await Membership.findById(req.params.id);
  
  if (!membership) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  const formData = req.body;
  const files = req.files || {};

  // Handle new file uploads and delete old ones
  const fileFields = ['photograph', 'mciFile', 'pgFile', 'otherDocs'];
  fileFields.forEach(field => {
    if (files[field]) {
      // Delete old file
      deleteSingleFile(membership[field]);
      // Set new path
      formData[field] = files[field][0].path.replace(/\\/g, '/');
    }
  });

  membership = await Membership.findByIdAndUpdate(req.params.id, formData, { 
    new: true,
    runValidators: true 
  });
  
  res.status(200).json({ success: true, message: 'Application updated successfully', data: membership });
});

// @desc Delete application and its files
// @route DELETE /api/membership/:id
exports.deleteMembership = asyncHandler(async (req, res) => {
  const membership = await Membership.findById(req.params.id);
  
  if (!membership) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete associated files
  const filePaths = [membership.photograph, membership.mciFile, membership.pgFile, membership.otherDocs];
  deleteFiles(filePaths);

  await membership.deleteOne();

  res.status(200).json({ success: true, message: 'Application and associated files deleted successfully' });
});
