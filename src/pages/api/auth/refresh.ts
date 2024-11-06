// src/pages/api/auth/refresh.ts

import { NextApiRequest, NextApiResponse } from 'next';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshToken,
  blacklistToken,
  deleteRefreshToken,
  isTokenExpired,
  isTokenBlacklisted
} from '../../../utils/TokenManagement/serverTokenUtils';
import crypto from 'crypto';
import { AuthResponse, SessionInfo, AuthContext } from '../../../types/Login/interfaces';
import { User } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { Collection, WithId } from 'mongodb';
import { COLLECTIONS } from '../../../constants/collections';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { redisService } from '../../../services/cache/redisService';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';
import { SecurityError } from '@/MonitoringSystem/constants/errors';

interface RefreshTokenContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: RefreshTokenContext = {
  component: 'RefreshTokenHandler',
  systemId: process.env.SYSTEM_ID || 'auth-service',
  systemName: 'AuthenticationService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development'
};

async function cleanupOldSession(
  sessionId: string,
  storedToken: string,
  newSessionId: string
): Promise<void> {
  const cleanupStartTime = Date.now();
  
  try {
    await blacklistToken(storedToken);
    await Promise.all([
      deleteRefreshToken(sessionId),
      redisService.deleteSession(sessionId),
      redisService.deleteValue(`jwt:${sessionId}`)
    ]);

    const cleanupDuration = Date.now() - cleanupStartTime;

    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'auth',
      'session_cleanup',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        oldSessionId: sessionId,
        newSessionId,
        duration: cleanupDuration,
        success: true,
        component: SYSTEM_CONTEXT.component
      }
    );

    monitoringManager.logger.info('Session cleanup completed', {
      category: LogCategory.SECURITY,
      pattern: LOG_PATTERNS.SECURITY,
      metadata: {
        oldSessionId: sessionId,
        newSessionId,
        duration: cleanupDuration,
        component: SYSTEM_CONTEXT.component
      }
    });
  } catch (cleanupError) {
    monitoringManager.logger.error(
      new Error('Session cleanup failed'),
      SecurityError.AUTH_SESSION_INVALID,
      {
        category: LogCategory.SECURITY,
        pattern: LOG_PATTERNS.SECURITY,
        metadata: {
          error: cleanupError,
          oldSessionId: sessionId,
          newSessionId,
          component: SYSTEM_CONTEXT.component
        }
      }
    );

    throw monitoringManager.error.createError(
      'security',
      SecurityError.AUTH_SESSION_INVALID,
      'Failed to cleanup old session',
      {
        cleanupError,
        oldSessionId: sessionId,
        newSessionId,
        component: SYSTEM_CONTEXT.component
      }
    );
  }
}

async function enrichSessionData(
  db: any,
  sessionData: any
): Promise<{ user: Omit<User, 'password'>, context: AuthContext }> {
  const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<WithId<Tenant>>;
  const currentTenant = await tenantsCollection.findOne({ tenantId: sessionData.tenants.context.currentTenantId });
  
  const currentAssociation = sessionData.tenants.associations[sessionData.tenants.context.currentTenantId];

  const context: AuthContext = {
    currentTenant: currentTenant || undefined,
    tenantOperations: {
      switchTenant: async (tenantId: string) => {
        // Implementation provided by client
      },
      getCurrentTenantRole: () => currentAssociation.role,
      getCurrentTenantPermissions: () => currentAssociation.permissions,
      isPersonalTenant: (tenantId: string) => tenantId === sessionData.tenants.context.personalTenantId
    },
    tenantQueries: {
      getCurrentTenant: () => sessionData.tenants.context.currentTenantId,
      getPersonalTenant: () => sessionData.tenants.context.personalTenantId,
      getTenantRole: (tenantId: string) => sessionData.tenants.associations[tenantId]?.role,
      getTenantPermissions: (tenantId: string) => sessionData.tenants.associations[tenantId]?.permissions || [],
      hasActiveTenantAssociation: (tenantId: string) => 
        sessionData.tenants.associations[tenantId]?.status === 'active'
    }
  };

  return {
    user: sessionData,
    context
  };
}

export default async function refreshHandler(req: NextApiRequest, res: NextApiResponse<AuthResponse | { error: string }>) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    monitoringManager.logger.info('Token refresh attempt initiated', {
      category: LogCategory.SECURITY,
      pattern: LOG_PATTERNS.SECURITY,
      metadata: {
        requestId,
        path: req.url,
        method: req.method,
        component: SYSTEM_CONTEXT.component
      }
    });

    if (req.method !== 'POST') {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_UNAUTHORIZED,
        'Method not allowed',
        {
          method: req.method,
          component: SYSTEM_CONTEXT.component,
          requestId
        }
      );
    }

    const { refreshToken, sessionId } = req.body;

    if (!refreshToken || !sessionId) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'Refresh token and session ID are required',
        {
          component: SYSTEM_CONTEXT.component,
          requestId
        }
      );
    }

    const storedToken = await getRefreshToken(sessionId);

    if (!storedToken || isTokenExpired(storedToken)) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_EXPIRED,
        'Refresh token expired or invalid',
        {
          sessionId,
          component: SYSTEM_CONTEXT.component,
          requestId
        }
      );
    }

    if (await isTokenBlacklisted(storedToken)) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'Refresh token is blacklisted',
        {
          sessionId,
          component: SYSTEM_CONTEXT.component,
          requestId
        }
      );
    }

    if (refreshToken !== storedToken) {
      await blacklistToken(storedToken);
      await deleteRefreshToken(sessionId);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'token_reuse_detected',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          sessionId,
          requestId,
          component: SYSTEM_CONTEXT.component
        }
      );

      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'Refresh token reuse detected',
        {
          sessionId,
          component: SYSTEM_CONTEXT.component,
          requestId
        }
      );
    }

    if (!verifyRefreshToken(refreshToken, storedToken)) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'Invalid refresh token',
        {
          sessionId,
          component: SYSTEM_CONTEXT.component,
          requestId
        }
      );
    }

    const sessionData = await redisService.getSession(sessionId);
    if (!sessionData) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_SESSION_INVALID,
        'Invalid session',
        {
          sessionId,
          component: SYSTEM_CONTEXT.component,
          requestId
        }
      );
    }

    const parsedSessionData = JSON.parse(sessionData);
    const { db } = await getCosmosClient();

    // Enrich session data with tenant context
    const { user, context } = await enrichSessionData(db, parsedSessionData);

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId: user.tenants.context.currentTenantId,
      role: user.tenants.associations[user.tenants.context.currentTenantId].role
    });
    const newRefreshToken = generateRefreshToken();
    const newSessionId = generateRefreshToken();

    // Create session info
    const sessionInfo: SessionInfo = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Store new session
    await redisService.storeAuthenticationData(
      newSessionId,
      newRefreshToken,
      JSON.stringify(user)
    );

    // Cleanup old session
    await cleanupOldSession(sessionId, storedToken, newSessionId);

    const authResponse: AuthResponse = {
      success: true,
      message: 'Tokens refreshed successfully',
      user,
      session: sessionInfo,
      context,
      onboardingComplete: user.onboardingStatus?.isOnboardingComplete || false
    };

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'token_refresh_success',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: user.userId,
        requestId,
        duration: Date.now() - startTime,
        component: SYSTEM_CONTEXT.component
      }
    );

    monitoringManager.logger.info('Token refresh completed successfully', {
      category: LogCategory.SECURITY,
      pattern: LOG_PATTERNS.SECURITY,
      metadata: {
        userId: user.userId,
        requestId,
        duration: Date.now() - startTime,
        component: SYSTEM_CONTEXT.component
      }
    });

    return res.status(200).json(authResponse);

  } catch (error) {
    monitoringManager.logger.error(
      new Error('Token refresh failed'),
      SecurityError.AUTH_FAILED,  // Consistent error usage
      {
        category: LogCategory.SECURITY,
        pattern: LOG_PATTERNS.SECURITY,
        metadata: {
          error: error instanceof Error ? error.message : 'unknown',
          requestId,
          duration: Date.now() - startTime,
          component: SYSTEM_CONTEXT.component
        }
      }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'auth',
      'token_refresh_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        requestId,
        duration: Date.now() - startTime,
        component: SYSTEM_CONTEXT.component
      }
    );

    const appError = monitoringManager.error.createError(
      'security',
      SecurityError.AUTH_FAILED,
      'Token refresh process failed',
      {
        error,
        requestId,
        duration: Date.now() - startTime,
        component: SYSTEM_CONTEXT.component
      }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage
    });
  }
}
