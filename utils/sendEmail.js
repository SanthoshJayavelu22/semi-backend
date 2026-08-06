const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, 
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log(`Sending email from: ${process.env.EMAIL_USER}`);
  console.log(`Using password length: ${process.env.EMAIL_PASS?.length}`);

  const mailOptions = {
    from: `"Society for Emergency Medicine India" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || []
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
