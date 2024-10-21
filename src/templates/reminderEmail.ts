import { baseTemplate } from './baseTemplate';
import { EmailTemplate } from '../../types/email';
import { EmailTheme } from '../constants/emailConstants';

const reminderEmailTemplate: EmailTemplate = {
  subject: 'Reminder: Complete Your Onboarding Process',
  getHtml: (recipientName: string, additionalData: Record<string, unknown>, theme: EmailTheme) => {
    const content = `
      <h1>Hello ${recipientName},</h1>
      <p>This is a friendly reminder to complete your onboarding process. Your current progress is ${additionalData.completedSteps} out of ${additionalData.totalSteps} steps.</p>
      <p>Your next step is: ${additionalData.nextStep}</p>
      <p>Please log in to your account to continue the onboarding process.</p>
      <a href="${additionalData.loginUrl}" class="button">Continue Onboarding</a>
    `;
    return baseTemplate(content, theme as unknown as string);
  }
};

export default reminderEmailTemplate;