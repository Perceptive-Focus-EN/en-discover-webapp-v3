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
    try {
      const response = await axiosInstance.get('/api/stripe/invoices');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices');
    }
  },

  async getUpcoming(): Promise<StripeUpcomingInvoice> {
    try {
      const response = await axiosInstance.get('/api/stripe/upcoming-invoice');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming invoice:', error);
      throw new Error('Failed to fetch upcoming invoice');
    }
  }
};