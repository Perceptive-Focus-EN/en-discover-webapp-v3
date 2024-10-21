// src/EmailWorkflow/templates/invitationEmail.ts
import { EmailTemplate } from "../types/email";
import { getEmailStyles, COMPANY_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from "../constants/emailConstants";

const invitationEmailTemplate: EmailTemplate<{ invitationLink: string; tenantName: string }> = {
  subject: `Invitation to Join ${COMPANY_NAME}`,
  getHtml: (recipientName, additionalData, theme) => {
    const { invitationLink, tenantName } = additionalData;
    const styles = getEmailStyles(theme);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join ${COMPANY_NAME}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to ${COMPANY_NAME}!</h1>
          <p>Hello${recipientName ? ` ${recipientName}` : ''},</p>
          <p>You've been invited to join the ${tenantName} tenant on our platform.</p>
          <p>To complete your registration and join the tenant, please click the button below:</p>
          <p>
            <a href="${invitationLink}" class="button">Accept Invitation</a>
          </p>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p>${invitationLink}</p>
          <p>This invitation will expire in 7 days. If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <div class="footer">
            <p>Best regards,<br>The ${COMPANY_NAME} Team</p>
            <p>Support: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

export default invitationEmailTemplate;