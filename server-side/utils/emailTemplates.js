const getAdminEmailTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
    .header { background-color: #004aad; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; background-color: white; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; color: #555; }
    .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Inquiry</h2>
    </div>
    <div class="content">
      <div class="field"><span class="label">Name:</span> ${data.name}</div>
      <div class="field"><span class="label">Email:</span> ${data.email}</div>
      <div class="field"><span class="label">Phone:</span> ${data.phone || 'Not provided'}</div>
      <div class="field"><span class="label">Subject:</span> ${data.subject}</div>
      <div class="field">
        <div class="label">Message:</div>
        <p style="background-color: #f1f1f1; padding: 10px; border-radius: 4px;">${data.message}</p>
      </div>
    </div>
    <div class="footer">
      <p>This email was sent via the SEMI Website Contact Form.</p>
    </div>
  </div>
</body>
</html>
`;

const getUserAutoReplyTemplate = (name, subject) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    .header { text-align: center; border-bottom: 2px solid #004aad; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #004aad; margin: 0; }
    .content { padding: 0 10px; }
    .button { display: inline-block; background-color: #004aad; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { border-top: 1px solid #eee; margin-top: 30px; padding-top: 15px; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Society for Emergency Medicine India</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <p>Thank you for reaching out to us regarding "<strong>${subject}</strong>".</p>
      <p>This is to confirm that we have received your message. Our team is reviewing your inquiry and will get back to you as soon as possible.</p>
      <p>If you have any urgent matters, please contact our head office directly.</p>
      <p>Best regards,<br>SEMI Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Society for Emergency Medicine India. All rights reserved.</p>
      <p>www.semi.org.in</p>
    </div>
  </div>
</body>
</html>
`;

const getMembershipConfirmationTemplate = (name) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #2563eb; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 40px; color: #1e293b; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .status-badge { display: inline-block; background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Membership Application Received</h1>
      </div>
      <div class="content">
        <div class="greeting">Dear ${name},</div>
        <div class="status-badge">Application Status: Pending Review</div>
        <p>Thank you for applying for membership with the <strong>Society for Emergency Medicine India (SEMI)</strong>.</p>
        <p>We have successfully received your application and the uploaded documents. Our membership committee will now review your submission.</p>
        <p>You will receive another update once your membership is approved. This process typically takes 3-5 working days.</p>
        <p>If you have any questions in the meantime, please feel free to contact us.</p>
        <p>Best Regards,<br><strong>SEMI Membership Team</strong></p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Society for Emergency Medicine India. All rights reserved.<br>
        <a href="https://semi.org.in" style="color: #2563eb; text-decoration: none;">www.semi.org.in</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = { getAdminEmailTemplate, getUserAutoReplyTemplate, getMembershipConfirmationTemplate };
