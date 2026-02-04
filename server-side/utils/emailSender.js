const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Use environment variables or defaults for Gmail
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"SEMI India" <${user}>`, // Use a nice sender name
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
