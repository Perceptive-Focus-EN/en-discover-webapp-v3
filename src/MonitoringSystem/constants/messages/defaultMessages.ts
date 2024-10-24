// src/constants/messages.ts
export const DEFAULT_MESSAGES = {
  ERROR: {
    GENERIC: 'Something went wrong. Please try again later.',
    NETWORK: 'Unable to connect to the server. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    VALIDATION: 'Please check your input and try again.',
    AUTH: 'Authentication failed. Please log in again.',
    SERVER: 'Server error. Our team has been notified.',
    MAINTENANCE: 'System is under maintenance. Please try again shortly.'
  },
  SUCCESS: {
    GENERIC: 'Operation completed successfully',
    AUTH: 'Successfully authenticated',
    SAVE: 'Changes saved successfully'
  }
} as const;