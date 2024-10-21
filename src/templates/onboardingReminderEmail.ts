// src/templates/reminderEmail.ts
import { baseTemplate } from './baseTemplate';
import { EmailTemplate } from '../types/email';
import { EmailTheme } from '../constants/emailConstants';

interface ReminderData {
  message: string;
  currentStep: string;
  completedSteps: number;
  totalSteps: number;
  nextStep: string;
  loginUrl: string;
}

const reminderEmailTemplate: EmailTemplate<ReminderData> = {
  subject: 'Continue Your Onboarding Journey: Next Steps Await',
  getHtml: (recipientName: string, additionalData: ReminderData, theme: EmailTheme) => {
    const progressPercentage = Math.round((additionalData.completedSteps / additionalData.totalSteps) * 100);
    
    const content = `
      <h1>Hello ${recipientName},</h1>
      <p>${additionalData.message}</p>
      <p>Your current step: <strong>${additionalData.currentStep}</strong></p>
      <p>You've made great progress! You've completed ${additionalData.completedSteps} out of ${additionalData.totalSteps} steps.</p>
      <div style="background-color: #e0e0e0; width: 100%; height: 20px; border-radius: 10px;">
        <div style="background-color: ${theme.primaryColor}; width: ${progressPercentage}%; height: 20px; border-radius: 10px;"></div>
      </div>
      <p style="text-align: center;">${progressPercentage}% Complete</p>
      <p>Ready to take the next step? Click the button below to continue your journey:</p>
      <a href="${additionalData.loginUrl}" style="background-color: ${theme.buttonColor}; color: ${theme.buttonTextColor}; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Continue Onboarding</a>
      <p style="font-size: 0.9em; color: ${theme.textColor}; margin-top: 20px;">If you need any assistance, please don't hesitate to contact our support team.</p>
    `;
    return baseTemplate(content, theme as unknown as string);
  }
};

export default reminderEmailTemplate;