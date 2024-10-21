export const patientVerificationNotificationTemplate = {
  subject: "Verify Your Email Address",
  getHtml: (
    recipientName: string,
    additionalData: Record<string, unknown>,
    css: string
  ): string => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email Address</title>
      <style>
        ${css}
        .token-container {
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          padding: 10px;
          margin: 20px 0;
          text-align: center;
        }
        .token {
          font-size: 24px;
          font-weight: bold;
          color: #1a3b5d;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #777777;
          font-size: 14px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verify Your Email Address</h1>
        <p>Dear ${recipientName},</p>
        <p>Thank you for signing up. Please verify your email address using the link below:</p>
        <div class="token-container">
          <p class="token">${additionalData.verificationToken}</p>
        </div>
        <div class="token-container">
          <p><a href="http://localhost:3000/verify-email?token=${additionalData.verificationToken}" class="link button">Verify Email</a></p>
        </div>
        <p>If you did not sign up for this account, please ignore this email.</p>
        <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:support@aetheriqmed.com" class="link">support@aetheriqmed.com</a> or by phone at (415) 704-1123.</p>
        <p>Best regards,<br>The AetherIQ Medical Team</p>
        <div class="footer">
          &copy; 2024 AetheriQ, Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,
};
