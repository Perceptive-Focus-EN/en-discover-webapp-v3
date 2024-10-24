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
import { AuthResponse } from '../../../types/Login/interfaces';
import { redisService } from '../../../services/cache/redisService';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export default async function refreshHandler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      const appError = monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        { method: req.method }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const { refreshToken, sessionId } = req.body;

    if (!refreshToken || !sessionId) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_VALIDATION_FAILED',
        'Refresh token and session ID are required'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const storedToken = await getRefreshToken(sessionId);

    if (!storedToken || isTokenExpired(storedToken)) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_EXPIRED',
        'Refresh token expired or invalid',
        { sessionId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    if (await isTokenBlacklisted(storedToken)) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_BLACKLISTED',
        'Refresh token is blacklisted',
        { sessionId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Token reuse detection
    if (refreshToken !== storedToken) {
      await blacklistToken(storedToken);
      await deleteRefreshToken(sessionId);
      
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_REUSED',
        'Refresh token reuse detected',
        { sessionId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'token_reuse_detected',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { sessionId }
      );

      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    if (!verifyRefreshToken(refreshToken, storedToken)) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid refresh token',
        { sessionId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Retrieve session data
    const sessionData = await redisService.getSession(sessionId);
    if (!sessionData) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_SESSION_INVALID',
        'Invalid session',
        { sessionId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const parsedSessionData = JSON.parse(sessionData);

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: parsedSessionData.userId,
      email: parsedSessionData.email,
      title: parsedSessionData.title,
      tenantId: parsedSessionData.tenantId
    });
    const newRefreshToken = generateRefreshToken();
    const newSessionId = generateRefreshToken();

    // Store new tokens with consistent prefixes
    await redisService.storeRefreshToken(newSessionId, newRefreshToken);
    await redisService.storeSession(newSessionId, JSON.stringify(parsedSessionData), 60 * 60 * 24);

    const authResponse: AuthResponse = {
      success: true,
      message: 'Tokens refreshed successfully',
      user: parsedSessionData,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
      onboardingComplete: parsedSessionData.onboardingStatus?.isOnboardingComplete || false,
      permissions: []
    };

    // Record success metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'token_refresh_success',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: parsedSessionData.userId,
        duration: Date.now() - startTime
      }
    );

    // Add additional security metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'auth',
      'token_refresh_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        sessionId,
        success: true,
        duration: Date.now() - startTime
      }
    );

    // Cleanup old session
    try {
      const cleanupStartTime = Date.now();
      
      // First blacklist the old token for security
      await blacklistToken(storedToken);
      
      // Then cleanup all related data
      await Promise.all([
        deleteRefreshToken(sessionId),
        redisService.deleteSession(sessionId),
        redisService.deleteValue(`jwt:${sessionId}`), // Clear any JWT associations
      ]);

      const cleanupDuration = Date.now() - cleanupStartTime;

      // Record detailed cleanup metrics
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'session_cleanup',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          oldSessionId: sessionId,
          newSessionId: newSessionId,
          duration: cleanupDuration,
          success: true
        }
      );

      // Record cleanup performance
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'auth',
        'cleanup_duration',
        cleanupDuration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'session_cleanup',
          oldSessionId: sessionId
        }
      );

      monitoringManager.logger.info('Successfully cleaned up old session', {
        oldSessionId: sessionId,
        newSessionId: newSessionId,
        duration: cleanupDuration
      });

    } catch (cleanupError) {
      // Record cleanup failure metrics
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'session_cleanup_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          oldSessionId: sessionId,
          newSessionId: newSessionId,
          error: cleanupError instanceof Error ? cleanupError.message : 'unknown'
        }
      );

      // Enhanced error logging
      monitoringManager.logger.warn('Failed to cleanup old session', {
        error: cleanupError,
        oldSessionId: sessionId,
        newSessionId: newSessionId,
        errorType: cleanupError instanceof Error ? cleanupError.name : 'unknown',
        errorMessage: cleanupError instanceof Error ? cleanupError.message : 'unknown'
      });

      // Create a non-blocking error for monitoring
      monitoringManager.error.createError(
        'security',
        'SESSION_CLEANUP_FAILED',
        'Failed to cleanup old session completely',
        { 
          cleanupError,
          oldSessionId: sessionId,
          newSessionId: newSessionId
        }
      );
    }
    return res.status(200).json(authResponse);

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'AUTH_REFRESH_FAILED',
      'Error refreshing token',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'token_refresh_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}
