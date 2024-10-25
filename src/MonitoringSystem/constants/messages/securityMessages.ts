// src/MonitoringSystem/constants/messages/securityMessages.ts
import { SecurityError } from "../errors/securityErrors";

export const SecurityMessages = {
  // Authentication Messages
  [SecurityError.AUTH_TOKEN_INVALID]: {
    error: 'Invalid authentication token',
    warn: 'Authentication token validation failed',
    info: 'Token validation check performed'
  },
  [SecurityError.AUTH_TOKEN_EXPIRED]: {
    error: 'Authentication token has expired',
    warn: 'Authentication token nearing expiration',
    info: 'Token expiration checked'
  },
  [SecurityError.AUTH_INVALID_CREDENTIALS]: {
    error: 'Invalid login credentials',
    warn: 'Multiple failed login attempts detected',
    info: 'Credential validation performed'
  },
  [SecurityError.AUTH_UNAUTHORIZED]: {
    error: 'Unauthorized access attempt',
    warn: 'Access denied due to missing authentication',
    info: 'Authorization check performed'
  },
  [SecurityError.AUTH_FORBIDDEN]: {
    error: 'Access forbidden',
    warn: 'Attempted access to restricted resource',
    info: 'Permission check performed'
  },

  [SecurityError.AUTH_TOKEN_FAILED]: {
    error: 'Token refresh failed',
    warn: 'Token refresh encountered issues',
    info: 'Token refresh attempted'
  },

  [SecurityError.AUTH_LOGOUT_FAILED]: {
    error: 'Logout failed',
    warn: 'Logout encountered issues',
    info: 'Logout attempted'
  },

  [SecurityError.AUTH_FAILED]: {
    error: 'Authentication failed',
    warn: 'Authentication encountered issues',
    info: 'Authentication attempted'
  },


  // Session Messages
  [SecurityError.SESSION_INVALID]: {
    error: 'Invalid session',
    warn: 'Session validation failed',
    info: 'Session check performed'
  },
  [SecurityError.SESSION_EXPIRED]: {
    error: 'Session has expired',
    warn: 'Session nearing expiration',
    info: 'Session expiration checked'
  },
  [SecurityError.SESSION_CREATE_FAILED]: {
    error: 'Failed to create session',
    warn: 'Session creation encountered issues',
    info: 'Session creation attempted'
  },

  // Tenant Messages
  [SecurityError.TENANT_NOT_FOUND]: {
    error: 'Tenant not found',
    warn: 'Attempted access to non-existent tenant',
    info: 'Tenant lookup performed'
  },
  [SecurityError.TENANT_CREATE_FAILED]: {
    error: 'Failed to create tenant',
    warn: 'Tenant creation encountered issues',
    info: 'Tenant creation attempted'
  },
  [SecurityError.TENANT_UPDATE_FAILED]: {
    error: 'Failed to update tenant',
    warn: 'Tenant update encountered issues',
    info: 'Tenant update attempted'
  },

  // Validation Messages
  [SecurityError.VALIDATION_INVALID_INPUT]: {
    error: 'Invalid input provided',
    warn: 'Input validation failed',
    info: 'Input validation performed'
  },
  [SecurityError.VALIDATION_MISSING_FIELD]: {
    error: 'Required field missing',
    warn: 'Missing required field in request',
    info: 'Field presence validation performed'
  },
  [SecurityError.VALIDATION_INVALID_FORMAT]: {
    error: 'Invalid format',
    warn: 'Format validation failed',
    info: 'Format validation performed'
  },

  [SecurityError.AUTH_REFRESH_FAILED]: {
    error: 'Failed to refresh authentication token',
    warn: 'Token refresh encountered issues',
    info: 'Token refresh attempted'
  },

  [SecurityError.REQUEST_INTERCEPTOR_ERROR]: {
    error: 'Request interceptor error',
    warn: 'Request interceptor encountered issues',
    info: 'Request interceptor attempted'
  },

  // API Messages
  [SecurityError.API_REQUEST_FAILED]: {
    error: 'API request failed',
    warn: 'API request encountered issues',
    info: 'API request attempted'
  },

} as const;