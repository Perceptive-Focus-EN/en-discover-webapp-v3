// src/email/templates/newDeviceLoginAlert.ts

export const newDeviceLoginAlertTemplate = {
  subject: "New Device Login Alert",
  getHtml: (
    recipientName: string,
    additionalData: Record<string, unknown>,
    css: string,
  ): string => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Device Login Alert</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="container">
          <h1>New Device Login Alert</h1>
          <p>Dear ${recipientName},</p>
          <p>We have detected a login to your AetherIQ Medical account from a new device:</p>
          <p><strong>Device Information:</strong> ${additionalData.deviceInfo}</p>
          <p>If this login attempt was made by you, you can safely disregard this message. However, if you did not initiate this login, please contact our support team immediately to secure your account.</p>
          <p>Best regards,<br>The AetherIQ Medical Team</p>
          <div class="footer">
            &copy; 2024 AetheriQ,Inc. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
};
