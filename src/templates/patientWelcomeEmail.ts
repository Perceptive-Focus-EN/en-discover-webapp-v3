export const patientWelcomeEmailTemplate = {
  subject: "Welcome to AetherIQ Medical",
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
      <title>Welcome to AetherIQ Medical</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to AetherIQ Medical</h1>
        <p>Dear ${recipientName},</p>
        <p>Welcome to AetherIQ Medical! We are thrilled to have you as a patient on our platform.</p>
        <p>As a registered patient, you now have access to our medical solutions and services.</p>
        <p>To get started, please verify your email using the following link:</p>
        <p><a href="https://aetheriqinc.com/login" class="link button">Log In</a></p>
        <p>If you have any questions or require assistance, our dedicated support team is here to help. You can reach us at <a href="mailto:support@aetheriqmed.com" class="link">support@aetheriqmed.com</a> or by phone at (415) 704-1123.</p>
        <p>We look forward to supporting you in providing exceptional care.</p>
        <p>Best regards,<br>The AetherIQ Medical Team</p>
        <div class="footer">
          &copy; 2024 AetheriQ, Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,
};