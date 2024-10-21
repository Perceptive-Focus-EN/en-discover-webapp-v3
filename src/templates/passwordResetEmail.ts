// src/templates/passwordResetEmail.ts
import { EmailTemplate } from '../types/email';
import { baseTemplate } from './baseTemplate';
import { getEmailStyles, EmailTheme, COMPANY_NAME } from '../constants/emailConstants';

const passwordResetEmail: EmailTemplate = {
  subject: 'Reset Your Password',
  getHtml: (recipientName: string, additionalData: { resetToken: string, resetUrl: string }, theme: EmailTheme) => {
    const styles = getEmailStyles(theme);
    const content = `
      <h1>Hello, ${recipientName}</h1>
      <p>We received a request to reset your password for your ${COMPANY_NAME} account. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, use the following code:</p>
      <div class="token-container">
        <span class="token">${additionalData.resetToken}</span>
      </div>
      <p>Alternatively, you can click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${additionalData.resetUrl}" class="button">Reset Password</a>
      </p>
      <p>This password reset link will expire in 1 hour.</p>
      <p>If you're having trouble, you can copy and paste the following URL into your browser:</p>
      <p>${additionalData.resetUrl}</p>
    `;
    return baseTemplate(content, styles);
  }
};

export default passwordResetEmail;