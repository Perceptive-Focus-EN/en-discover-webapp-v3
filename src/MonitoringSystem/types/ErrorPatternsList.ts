// src/MonitoringSystem/types/ErrorPatternsList.ts
export const ErrorPatternsList = [
  // Dynamic patterns with placeholders
  'SYS_{component}_{action}_{timestamp}',
  'API_{method}_{resource}_{timestamp}',
  'SEC_{context}_{action}_{timestamp}',
  'INT_{service}_{operation}_{timestamp}',
] as const;

// Type safety for pattern components
export type ErrorComponent = {
  category: 'SYS' | 'API' | 'SEC' | 'INT';
  component?: string;
  action: string;
  context?: string;
  timestamp?: string;
};