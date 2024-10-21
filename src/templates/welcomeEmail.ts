import { baseTemplate } from './baseTemplate';
import { COMPANY_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '../constants/emailConstants';

export const welcomeEmailTemplate = {
  subject: `Welcome to ${COMPANY_NAME}!`,
  getHtml: (recipientName: string, additionalData: Record<string, unknown>, css: string): string => {
    const content = `
      <h1>Welcome to ${COMPANY_NAME}</h1>
      <p>Dear ${recipientName},</p>
      <p>Welcome to ${COMPANY_NAME}! We are thrilled to have you as a member of our platform.</p>
      <p>To get started, please log in to your account using the following link:</p>
      <p><a href="${additionalData.loginUrl}" class="button">Log In</a></p>
      <p>If you have any questions or require assistance, our dedicated support team is here to help. You can reach us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> or by phone at ${SUPPORT_PHONE}.</p>
      <p>We look forward to supporting you in your journey with us.</p>
      <p>Best regards,<br>The ${COMPANY_NAME} Team</p>
    `;
    return baseTemplate(content, css);
  },
};

export default welcomeEmailTemplate;