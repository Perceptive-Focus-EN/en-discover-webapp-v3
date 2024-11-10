// pages/api/settings/[category]/[action].ts

import { NextApiRequest, NextApiResponse } from 'next';
import * as settingsController from '../../controllers/settingsController';
import { monitoringManager } from '../../../../MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { ErrorType } from '@/MonitoringSystem/constants/errors';
import { AppError } from '@/MonitoringSystem/managers/AppError';

// Enhanced type definitions
interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    tenantId: string;
  };
}

type SettingsHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

// Valid categories and actions for runtime validation
const VALID_CATEGORIES = [
  'notifications',
  'private',
  'overseer-invites',
  'style',
  'faq',
  'rate-app',
  'terms',
  'privacy-policy',
  'all',
  'app-rating'
] as const;

const VALID_ACTIONS = ['get', 'update', 'submit'] as const;

type Category = typeof VALID_CATEGORIES[number];
type Action = typeof VALID_ACTIONS[number];

// Type-safe handlers mapping
const handlers: Record<Category, Partial<Record<Action, SettingsHandler>>> = {
  notifications: {
    get: settingsController.getNotifications,
    update: settingsController.updateNotifications,
  },
  private: {
    get: settingsController.getPrivateSettings,
    update: settingsController.updatePrivateSettings,
  },
  'overseer-invites': {
    get: settingsController.getOverseerInvites,
    update: settingsController.updateOverseerInvites,
  },
  style: {
    get: settingsController.getStyleSettings,
    update: settingsController.updateStyleSettings,
  },
  faq: {
    get: settingsController.getFaq,
  },
  'rate-app': {
    submit: settingsController.submitAppRating,
  },
  'app-rating': {
    get: settingsController.getAppRating,
    submit: settingsController.submitAppRating,
  },
  terms: {
    get: settingsController.getTerms,
  },
  'privacy-policy': {
    get: settingsController.getPrivacyPolicy,
  },
  all: {
    get: settingsController.getAllSettings,
    update: settingsController.updateAllSettings,
  },
};

// Validation functions
const isValidCategory = (category: string): category is Category => {
  return VALID_CATEGORIES.includes(category as Category);
};

const isValidAction = (action: string): action is Action => {
  return VALID_ACTIONS.includes(action as Action);
};

// Enhanced error handling
class ApiError extends AppError {
    constructor(
      public statusCode: number,
      message: string,
      public details?: any
    ) {
      super({
        type: 'client_error/api' as ErrorType,
        message,
        metadata: details,
        statusCode,
        errorReference: 'api_error',
        tenantId: 'default-tenant-id', // Define tenantId
      });
    }
  }


// Main handler
const handler = async (req: AuthenticatedRequest, res: NextApiResponse): Promise<void> => {
  const { category, action } = req.query;

  // Record the start time for performance metrics
  const startTime = Date.now();

  try {
    // Validate category and action
    if (!category || !action || typeof category !== 'string' || typeof action !== 'string') {
      throw new ApiError(400, 'Invalid request parameters');
    }

    // Validate category exists
    if (!isValidCategory(category)) {
      throw new ApiError(404, `Invalid category: ${category}`);
    }

    // Validate action exists
    if (!isValidAction(action)) {
      throw new ApiError(404, `Invalid action: ${action}`);
    }

    // Validate handler exists
    const handler = handlers[category][action];
    if (!handler) {
      throw new ApiError(404, `No handler found for ${category}/${action}`);
    }

    // Validate HTTP method
    const allowedMethods: Record<Action, string[]> = {
      get: ['GET'],
      update: ['PUT', 'PATCH'],
      submit: ['POST'],
    };

    if (!allowedMethods[action].includes(req.method || '')) {
      throw new ApiError(405, `Method ${req.method} not allowed for ${action}`);
    }

    // Execute handler
    await handler(req, res);

    // Record successful execution metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      `settings/${category}/${action}`,
      'execution_time',
      Date.now() - startTime,
      MetricType.GAUGE,
      MetricUnit.MILLISECONDS,
      { status: 'success' }
    );

  } catch (error) {
    // Use MonitoringManager to handle and record error
    const currentTenantId = req.user?.tenantId || 'default-tenant-id'; // Define currentTenantId

    const appError = error instanceof AppError ? error : new AppError({
      type: 'server_error/unhandled' as ErrorType,
      message: 'Unhandled server error',
      metadata: { category, action, originalError: error instanceof Error ? error.message : 'Unknown error' },
      statusCode: 500,
      errorReference: 'some-reference', // Provide a valid error reference
      tenantId: currentTenantId,
    });
    const statusCode = appError.statusCode;

    // Record error using MonitoringManager
    monitoringManager.error.handleError(appError);
    
    // Log the error with contextual details
    monitoringManager.logger.error(appError, SystemError.SERVER_INTERNAL_ERROR, {
      category,
      action,
      statusCode,
      ...appError.metadata,
    });
    
    // Record failure metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      `settings/${category}/${action}`,
      'execution_time',
      Date.now() - startTime,
      MetricType.GAUGE,
      MetricUnit.MILLISECONDS,
      { status: 'failure' }
    );

    // Respond with error
    res.status(statusCode).json({
      success: false,
      message: appError.message,
      details: appError.metadata,
    });
  }
};

export default handler;
