// src/lib/api_s/stripe/invoices.ts
import axiosInstance from '../../axiosSetup';

interface StripeInvoice {
  id: string;
  customer: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  total: number;
  currency: string;
  created: number;
  period_start: number;
  period_end: number;
}

interface StripeUpcomingInvoice extends StripeInvoice {
  next_payment_attempt: number;
}

export const invoicesApi = {
  async getAll(): Promise<StripeInvoice[]> {
    const response = await axiosInstance.get('/api/stripe/invoices');
    return response.data;
  },

  async getUpcoming(): Promise<StripeUpcomingInvoice> {
    const response = await axiosInstance.get('/api/stripe/upcoming-invoice');
    return response.data;
  }
};