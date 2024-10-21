// src/types/email.ts

import { EmailTheme } from '../constants/emailConstants';

export interface EmailTemplate<T = Record<string, unknown>> {
  subject: string;
  getHtml: (recipientName: string, additionalData: T, theme: EmailTheme) => string;
}

export interface EmailData<T = Record<string, unknown>> {
  recipientEmail: string;
  recipientName: string;
  additionalData?: T;
}

export interface BaseEmailData<T = Record<string, unknown>> {
  recipientEmail: string;
  recipientName: string;
  additionalData?: T;
}

export interface TicketEmailData extends BaseEmailData {
  ticketId: string;
  category: string;
  updatedAt: Date;
}

export interface TicketSubmissionEmailData extends TicketEmailData {
  description: string;
  createdAt: Date;
}

export interface TicketStatusUpdateEmailData extends TicketEmailData {
  status: string;
}

export interface TicketAssignmentEmailData extends TicketEmailData {
  assignee: string;
}

export interface TicketResolutionEmailData extends TicketEmailData {
  resolution: string;
}

export interface TicketFeedbackEmailData extends TicketEmailData {
  feedback: string;
}

export interface TicketRatingEmailData extends TicketEmailData {
  rating: number;
}

export interface TicketCommentEmailData extends TicketEmailData {
  comment: string;
}

export interface TicketMentionEmailData extends TicketEmailData {
  mention: string;
}

export interface TicketTagEmailData extends TicketEmailData {
  tag: string;
}

export interface TicketAttachmentEmailData extends TicketEmailData {
  attachment: string;
}