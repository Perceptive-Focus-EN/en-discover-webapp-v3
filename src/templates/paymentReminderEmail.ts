// src/templates/paymentReminderEmail.ts

import { baseTemplate } from './baseTemplate';
import { EmailTemplate } from '../types/email';
import { EmailTheme } from '../constants/emailConstants';

interface PaymentReminderData {
  daysUntilDue: number;
  amountDue: number;
  dueDate: string;
}

const paymentReminderEmailTemplate: EmailTemplate<PaymentReminderData> = {
  subject: 'Payment Reminder: Your subscription payment is due soon',
  getHtml: (recipientName: string, additionalData: PaymentReminderData, theme: EmailTheme) => {
    const content = `
      <h1>Hello ${recipientName},</h1>
      <p>This is a friendly reminder that your subscription payment is due in ${additionalData.daysUntilDue} days.</p>
      <p>Amount due: $${additionalData.amountDue.toFixed(2)}</p>
      <p>Due date: ${new Date(additionalData.dueDate).toLocaleDateString()}</p>
      <p>Please ensure your payment method is up to date to avoid any service interruptions.</p>
      <a href="${process.env.FRONTEND_URL}/billing" class="button">Review Billing</a>
    `;
    return baseTemplate(content, theme as unknown as string);
  }
};

export default paymentReminderEmailTemplate;