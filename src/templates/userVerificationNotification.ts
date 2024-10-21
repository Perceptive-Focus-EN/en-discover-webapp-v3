// src/templates/userVerificationNotification.ts
import { EmailTemplate } from '../types/email';
import { baseTemplate } from './baseTemplate';
import { getEmailStyles, EmailTheme } from '../constants/emailConstants';

const userVerificationNotification: EmailTemplate = {
  subject: 'Verify Your Email Address',
  getHtml: (recipientName: string, additionalData: { verificationToken: string }, theme: EmailTheme) => {
    const styles = getEmailStyles(theme);
    const content = `
      <h1>Welcome, ${recipientName}!</h1>
      <p>Thank you for signing up. To complete your registration, please verify your email address by entering the following verification code:</p>
      <div class="token-container">
        <span class="token">${additionalData.verificationToken}</span>
      </div>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>This verification code will expire in 24 hours.</p>
    `;
    return baseTemplate(content, styles);
  }
};

export default userVerificationNotification;