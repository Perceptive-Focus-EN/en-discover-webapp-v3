import {
  PaymentMethod,
  Stripe,
  StripeElements,
  Token,
  PaymentIntent,
  SetupIntent,
  CustomerOptions,
} from '@stripe/stripe-js';
import CardElement from '@stripe/react-stripe-js';

// Define Plan type
export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  paymentLink: string;
}

// Define props for PlanSelection component
export interface PlanSelectionProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
}

// Define props for PaymentForm component
export interface PaymentFormProps {
  plan: Plan;
  onPaymentSuccess: (paymentMethod: PaymentMethod) => void;
}

// Define types for Stripe SDK elements and results
export type { PaymentMethod, Stripe, StripeElements, CardElement, Token, PaymentIntent, SetupIntent };

// Define any additional types needed for Stripe billing
export interface BillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    city?: string;
    country?: string;
    line1?: string;
    line2?: string;
    postal_code?: string;
    state?: string;
  };
}

export interface PaymentMethodResult {
  paymentMethod?: PaymentMethod;
  error?: {
    message?: string;
    type: string;
  };
}

export interface PaymentIntentResult {
  paymentIntent?: PaymentIntent;
  error?: {
    message?: string;
    type: string;
  };
}

export interface SetupIntentResult {
  setupIntent?: SetupIntent;
  error?: {
    message?: string;
    type: string;
  };
}

export interface TokenResult {
  token?: Token;
  error?: {
    message?: string;
    type: string;
  };
}

// Define types for the credit retrieval API response
export interface CreditBalance {
  id: string;
  user: string;
  amount: number;
}

export interface CreditBalanceResponse {
  credits: CreditBalance[];
}

// Define types for the Stripe Customer and CashBalance objects
export interface StripeCustomer extends CustomerOptions {
  email?: string;
}
