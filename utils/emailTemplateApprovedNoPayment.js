const getMembershipApprovedNoPaymentTemplate = (name, customMessage) => {
  const logoCid = 'https://www.semi.org.in/assets/semi%20logo-D0JY8eCV.png';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .content-box { line-height: 1.6; color: #1e293b; font-size: 16px; }
    .custom-message { background-color: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; font-style: italic; }
    .account-box { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin: 24px 0; }
    .account-row { margin: 8px 0; }
    .account-label { font-weight: bold; color: #334155; }
    .account-value { color: #1e293b; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${logoCid}" alt="SEMI Logo" style="width: 120px; height: auto;">
              <h1 style="color: #1e293b; margin: 20px 0 0 0; font-size: 24px;">Application Approved!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <div class="content-box">
                <p>Dear <strong>${name}</strong>,</p>
                <p>Congratulations! Your membership application for the <strong>Society for Emergency Medicine India (SEMI)</strong> has been approved.</p>

                ${customMessage ? `<div class="custom-message">${customMessage}</div>` : ''}

                <p>To complete your membership process, please proceed with the payment using the below account details:</p>

                <div class="account-box">
                  <div class="account-row"><span class="account-label">A/c name: </span><span class="account-value">Society for Emergency Medicine India</span></div>
                  <div class="account-row"><span class="account-label">Savings A/c no: </span><span class="account-value">920010001014390</span></div>
                  <div class="account-row"><span class="account-label">IFSC: </span><span class="account-value">UTIB0000030</span></div>
                  <div class="account-row"><span class="account-label">Bank: </span><span class="account-value">Axis</span></div>
                  <div class="account-row"><span class="account-label">Branch: </span><span class="account-value">Jubilee Hills</span></div>
                  <div class="account-row"><span class="account-label">Amount: </span><span class="account-value">10000/- (Ten Thousand Rupees only)</span></div>
                </div>

                <p>Welcome to the SEMI family!</p>
                <p>Best Regards,<br><strong>SEMI Membership Team</strong></p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #f1f5f9; color: #64748b; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Society for Emergency Medicine India. All rights reserved.<br>
              <a href="https://semi.org.in" style="color: #2563eb; text-decoration: none; margin-top: 8px; display: inline-block;">www.semi.org.in</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = { getMembershipApprovedNoPaymentTemplate };
