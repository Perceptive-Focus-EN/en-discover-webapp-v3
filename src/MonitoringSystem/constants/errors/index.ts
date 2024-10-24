// src/MonitoringSystem/constants/errors/index.ts

import { BusinessError } from './businessErrors';
import { IntegrationError } from './integrationErrors';
import { SecurityError } from './securityErrors';
import { SystemError } from './systemErrors';

// Re-export all error enums
export { SystemError } from './systemErrors';
export { SecurityError } from './securityErrors';
export { BusinessError } from './businessErrors';
export { IntegrationError } from './integrationErrors';

// Create literal type unions for each error category
export type SystemErrorType = `system/${string}`;
export type SecurityErrorType = `security/${string}`;
export type BusinessErrorType = `business/${string}`;
export type IntegrationErrorType = `integration/${string}`;

// Combined error type
export type ErrorType =
  | SystemErrorType
  | SecurityErrorType
  | BusinessErrorType
  | IntegrationErrorType;

// Error category type
export type ErrorCategory = 'system' | 'security' | 'business' | 'integration';

// Helper function to check if a string is a valid error type
export const isValidErrorType = (type: string): type is ErrorType => {
  const [category] = type.split('/');
  return ['system', 'security', 'business', 'integration'].includes(category);
};

// Error enum mapping
export const ErrorEnums = {
  system: SystemError,
  security: SecurityError,
  business: BusinessError,
  integration: IntegrationError
} as const;