// src/types/paymentReminder.ts

export interface PaymentReminderData extends Record<string, unknown> {
  daysUntilDue: number;
  amountDue: number;
  dueDate: string;
}