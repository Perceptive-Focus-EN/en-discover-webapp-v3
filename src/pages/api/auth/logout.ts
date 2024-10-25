// pages/api/auth/logout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError, SecurityError, BusinessError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface LogoutContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: LogoutContext = {
  component: 'LogoutHandler',
  systemId: process.env.SYSTEM_ID || 'auth-service',
  systemName: 'AuthenticationService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development'
};

export default async function logoutHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'logout_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { 
        requestId,
        path: req.url 
      }
    );

    monitoringManager.logger.info('Logout attempt initiated', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: {
        requestId,
        path: req.url,
        method: req.method
      }
    });

    if (req.method !== 'POST') {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed',
        { method: req.method }
      );
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_UNAUTHORIZED,
        'No token provided'
      );
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'Invalid token'
      );
    }

    const { db } = await getCosmosClient();
    const tokenBlacklistCollection = db.collection(COLLECTIONS.TOKEN_BLACKLIST);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Add token to blacklist with additional metadata
    const blacklistEntry = {
      token,
      userId: decodedToken.userId,
      createdAt: new Date(),
      expiresAt: new Date(decodedToken.exp * 1000),
      metadata: {
        requestId,
        userAgent: req.headers['user-agent'],
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }
    };

    await tokenBlacklistCollection.insertOne(blacklistEntry);

    monitoringManager.logger.info('Token blacklisted', {
      category: LogCategory.SECURITY,
      pattern: LOG_PATTERNS.SECURITY,
      metadata: {
        userId: decodedToken.userId,
        tokenExp: new Date(decodedToken.exp * 1000),
        requestId
      }
    });

    // Update user's session state
    const updateResult = await usersCollection.updateOne(
      { userId: decodedToken.userId },
      {
        $set: {
          lastLogout: new Date().toISOString(),
          isOnline: false,
          sessionId: null,
          refreshToken: null
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.USER_UPDATE_FAILED,
        'Failed to update user session state',
        { userId: decodedToken.userId }
      );
    }

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'logout_success',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        requestId,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Logout successful', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: {
        userId: decodedToken.userId,
        requestId,
        duration: Date.now() - startTime
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'logout_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        requestId,
        duration: Date.now() - startTime
      }
    );

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Logout process failed',
      { 
        error,
        requestId,
        duration: Date.now() - startTime
      }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}