import emailClient from "../config/azureEmail";
import { 
  EmailTemplate, 
  EmailData, 
  BaseEmailData,
  TicketEmailData,
  TicketSubmissionEmailData,
  TicketStatusUpdateEmailData,
  TicketAssignmentEmailData,
  TicketResolutionEmailData,
  TicketFeedbackEmailData,
  TicketRatingEmailData,
  TicketCommentEmailData,
  TicketMentionEmailData,
  TicketTagEmailData,
  TicketAttachmentEmailData
} from "../types/email";
import { getEmailStyles, defaultTheme, EmailTheme } from "../constants/emailConstants";
// import { BillingAlertData } from "../types/Billing";
import { PaymentReminderData } from "../types/paymentReminder";

async function sendEmail<T extends Record<string, unknown>>(template: EmailTemplate<T>, emailData: EmailData<T>, theme: EmailTheme = defaultTheme): Promise<void> {
  const { recipientEmail, recipientName, additionalData = {} as T } = emailData;
  const senderAddress = process.env.AETHERIQ_EMAIL_SENDER_ADDRESS;

  if (!senderAddress) {
    throw new Error("EMAIL_SENDER_ADDRESS environment variable is not set");
  }

  const emailStyles = getEmailStyles(theme);

  const emailMessage = {
    senderAddress: senderAddress,
    content: {
      subject: template.subject,
      html: template.getHtml(recipientName, additionalData, theme),
    },
    recipients: {
      to: [{ address: recipientEmail }],
    },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    console.log(`Email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export const sendDynamicEmail = async <T extends Record<string, unknown>>(
  templateName: string, 
  emailData: EmailData<T>, 
  theme: EmailTheme = defaultTheme
): Promise<void> => {
  try {
    const template = await import(`../templates/${templateName}`);
    await sendEmail<T>(template.default, emailData, theme);
  } catch (error) {
    console.error(`Failed to send ${templateName} email:`, error);
    throw new Error(`Failed to send ${templateName} email`);
  }
};

export const sendPasswordResetSuccessEmail = (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("passwordResetSuccessEmail", emailData, theme);
}

export const sendVerificationEmail = async (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  try {
    await sendDynamicEmail("userVerificationNotification", emailData, theme);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendWelcomeEmail = (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("welcomeEmail", emailData, theme);
};

export const sendPasswordResetEmail = async (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  try {
    await sendDynamicEmail("passwordResetEmail", emailData, theme);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendPasswordChangedEmail = (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("passwordChangedEmail", emailData, theme);
}

export const sendUserInviteEmail = (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("userInviteEmail", emailData, theme);
}

export const sendUserInviteAcceptedEmail = (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("userInviteAcceptedEmail", emailData, theme);
}

export const sendUserInviteExpiredEmail = (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("userInviteExpiredEmail", emailData, theme);
}

export const sendUserInviteRejectedEmail = (emailData: BaseEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("userInviteRejectedEmail", emailData, theme);
}

export const sendOnboardingReminderEmail = (emailData: BaseEmailData, theme: EmailTheme = defaultTheme): Promise<void> => {
  return sendDynamicEmail("onboardingReminderEmail", emailData, theme);
};

export const sendTicketSubmissionSuccessEmail = (emailData: TicketSubmissionEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketSubmissionSuccessEmail", emailData, theme);
}

export const sendTicketStatusUpdateEmail = (emailData: TicketStatusUpdateEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketStatusUpdateEmail", emailData, theme);
}

export const sendTicketAssignmentEmail = (emailData: TicketAssignmentEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketAssignmentEmail", emailData, theme);
}

export const sendTicketResolutionEmail = (emailData: TicketResolutionEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketResolutionEmail", emailData, theme);
}

export const sendTicketClosureEmail = (emailData: TicketResolutionEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketClosureEmail", emailData, theme);
}

export const sendTicketReopenEmail = (emailData: TicketEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketReopenEmail", emailData, theme);
}

export const sendTicketFeedbackEmail = (emailData: TicketFeedbackEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketFeedbackEmail", emailData, theme);
}

export const sendTicketRatingEmail = (emailData: TicketRatingEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketRatingEmail", emailData, theme);
}

export const sendTicketCommentEmail = (emailData: TicketCommentEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketCommentEmail", emailData, theme);
}

export const sendTicketMentionEmail = (emailData: TicketMentionEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketMentionEmail", emailData, theme);
}

export const sendTicketTagEmail = (emailData: TicketTagEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketTagEmail", emailData, theme);
}

export const sendTicketAttachmentEmail = (emailData: TicketAttachmentEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketAttachmentEmail", emailData, theme);
}

export const sendTicketDeleteEmail = (emailData: TicketEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketDeleteEmail", emailData, theme);
}

export const sendTicketRestoreEmail = (emailData: TicketEmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("ticketRestoreEmail", emailData, theme);
}

// export const sendBillingAlertEmail = (emailData: EmailData<BillingAlertData>, theme?: EmailTheme): Promise<void> => {
//   return sendDynamicEmail<BillingAlertData>("billingAlertEmail", emailData, theme);
// };

export const sendInvoiceEmail = (emailData: EmailData, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("invoiceEmail", emailData, theme);
};

export const sendPaymentReminderEmail = (emailData: EmailData<PaymentReminderData>, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail<PaymentReminderData>("paymentReminderEmail", emailData, theme);
};

export const sendInvitationEmail = (emailData: EmailData<{ invitationLink: string; tenantName: string }>, theme?: EmailTheme): Promise<void> => {
  return sendDynamicEmail("invitationEmail", emailData, theme);
};

