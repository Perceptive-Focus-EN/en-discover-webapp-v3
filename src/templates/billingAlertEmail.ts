// src/templates/billingAlertEmail.ts

import { baseTemplate } from './baseTemplate';
import { EmailTemplate } from '../types/email';
import { EmailTheme } from '../constants/emailConstants';
import { BillingAlertData } from '../types/billing'; // Add this import

const billingAlertEmailTemplate: EmailTemplate<BillingAlertData> = {
  subject: 'Billing Alert: Resource Usage Nearing Limit',
  getHtml: (recipientName: string, additionalData: BillingAlertData, theme: EmailTheme) => {
    const content = `
      <h1>Hello ${recipientName},</h1>
      <p>Your usage of ${additionalData.resourceType} is nearing the quota limit.</p>
      <p>Current usage: ${additionalData.usageAmount} (${additionalData.percentageUsed.toFixed(2)}% of quota)</p>
      <p>Quota: ${additionalData.quotaAmount}</p>
      <p>Please review your usage or consider upgrading your plan to avoid service interruptions.</p>
      <a href="${process.env.FRONTEND_URL}/billing" class="button">Review Billing</a>
    `;
    return baseTemplate(content, theme as unknown as string);
  }
};

export default billingAlertEmailTemplate;