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
    // Record logout attempt
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

    // Method check
    if (req.method !== 'POST') {
      const error = monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed',
        { method: req.method }
      );
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Clear auth cookies regardless of token presence
    res.setHeader('Set-Cookie', [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'
    ]);

    const token = req.headers.authorization?.split(' ')[1];
    
    // If no token present, consider it a successful logout
    if (!token) {
      monitoringManager.logger.info('Logout successful - No token present', {
        category: LogCategory.BUSINESS,
        pattern: LOG_PATTERNS.BUSINESS,
        metadata: {
          requestId,
          duration: Date.now() - startTime
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    // Verify token if present
    let decodedToken;
    try {
      decodedToken = verifyAccessToken(token);
    } catch (error) {
      // If token is invalid, still consider it a successful logout
      monitoringManager.logger.info('Logout successful - Invalid token', {
        category: LogCategory.SECURITY,
        pattern: LOG_PATTERNS.SECURITY,
        metadata: {
          requestId,
          error: error instanceof Error ? error.message : 'Token verification failed'
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    // If we have a valid token, proceed with cleanup
    const { db } = await getCosmosClient();
    const tokenBlacklistCollection = db.collection(COLLECTIONS.TOKEN_BLACKLIST);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Add token to blacklist
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

    await Promise.all([
      // Blacklist token
      tokenBlacklistCollection.insertOne(blacklistEntry),
      
      // Update user session state
      usersCollection.updateOne(
        { userId: decodedToken.userId },
        {
          $set: {
            lastLogout: new Date().toISOString(),
            isOnline: false,
            sessionId: null,
            refreshToken: null
          }
        }
      )
    ]);

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

    monitoringManager.logger.info('Logout successful with cleanup', {
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

    // Even if there's an error in the cleanup process, we want to ensure the user is logged out
    res.setHeader('Set-Cookie', [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'
    ]);

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

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      warning: 'Some cleanup operations may have failed'
    });
  }
}