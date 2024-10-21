// src/types/store.ts
export interface StoreItem {
  type: 'feature' | 'colorPalette' | 'spotify' | 'bundle';
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    period: string;
  };
  recurringPrice?: {
    amount: number;
    currency: string;
    period: string;
  };
  image: string;
}