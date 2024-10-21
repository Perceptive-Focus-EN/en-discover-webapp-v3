// src/EmailWorkflow/templates/invoiceEmail.ts

import { baseTemplate } from './baseTemplate';
import { EmailTemplate } from '../types/email';
import { EmailTheme } from '../constants/emailConstants';

interface InvoiceData {
  invoice: {
    lineItems: Array<{ resourceType: string; usageAmount: number; cost: number }>;
    totalCost: number;
  };
}

const invoiceEmailTemplate: EmailTemplate<InvoiceData> = {
  subject: 'Your Monthly Invoice',
  getHtml: (recipientName: string, additionalData: InvoiceData, theme: EmailTheme) => {
    const { invoice } = additionalData;
    const lineItems = invoice.lineItems.map(item => `
      <tr>
        <td>${item.resourceType}</td>
        <td>${item.usageAmount}</td>
        <td>$${item.cost.toFixed(2)}</td>
      </tr>
    `).join('');

    const content = `
      <h1>Hello ${recipientName},</h1>
      <p>Here's your invoice for the current billing period:</p>
      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Usage</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Total</td>
            <td>$${invoice.totalCost.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <a href="${process.env.FRONTEND_URL}/billing" class="button">View Billing Details</a>
    `;
    return baseTemplate(content, theme as unknown as string);
  }
};

export default invoiceEmailTemplate;