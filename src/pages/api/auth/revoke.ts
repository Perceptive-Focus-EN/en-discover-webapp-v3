
// HOW THIS WORKS
// Initial
//    'token_revocation_attempt'
//During process
//     'token_revocation_complete'
//      revocation_cleanup'
//     'revocation_cleanup_duration'
//     'token_store_duration'
//Final
//     'session_rotation_complete'
//     'token_revocation_success'


import { NextApiRequest, NextApiResponse } from 'next';
import { 
  blacklistToken, 
  generateAccessToken, 
  generateRefreshToken, 
  setRefreshToken,
  deleteRefreshToken
} from '../../../utils/TokenManagement/serverTokenUtils';
import { AuthResponse } from '../../../types/Login/interfaces';
import { redisService } from '../../../services/cache/redisService';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export default async function revokeHandler(req: NextApiRequest, res: NextApiResponse) {
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

    // Record revocation attempt
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'auth',
      'token_revocation_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { sessionId }
    );

    // Revoke old tokens with enhanced security checks
    try {
      const revocationStartTime = Date.now();
      
      await Promise.all([
        blacklistToken(refreshToken),
        deleteRefreshToken(sessionId),
        // Additional security measures
        redisService.setValue(`revoked:${sessionId}`, 'true', 60 * 60 * 24) // 24h record of revocation
      ]);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'token_revocation_complete',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          sessionId,
          duration: Date.now() - revocationStartTime
        }
      );

      monitoringManager.logger.info('Tokens successfully revoked', {
        sessionId,
        duration: Date.now() - revocationStartTime
      });

    } catch (revocationError) {
      throw monitoringManager.error.createError(
        'security',
        'TOKEN_REVOCATION_FAILED',
        'Failed to revoke tokens completely',
        {
          sessionId,
          error: revocationError
        }
      );
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

    // Cleanup old session data
    try {
      const cleanupStartTime = Date.now();
      
      // Cleanup old session data in parallel
      await Promise.all([
        redisService.deleteSession(sessionId),
        redisService.deleteValue(`jwt:${sessionId}`),
        // Any other session-related cleanup
      ]);

      const cleanupDuration = Date.now() - cleanupStartTime;

      // Record cleanup metrics
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'revocation_cleanup',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          oldSessionId: sessionId,
          duration: cleanupDuration,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'auth',
        'revocation_cleanup_duration',
        cleanupDuration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'session_cleanup',
          oldSessionId: sessionId
        }
      );

    } catch (cleanupError) {
      // Log cleanup error but continue with token generation
      monitoringManager.logger.warn('Failed to cleanup old session during revocation', {
        error: cleanupError,
        sessionId,
        errorType: cleanupError instanceof Error ? cleanupError.name : 'unknown'
      });

      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'revocation_cleanup_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          sessionId,
          error: cleanupError instanceof Error ? cleanupError.message : 'unknown'
        }
      );
    }


    // Before generating new tokens check if session was already revoked
    // This is an additional security measure to prevent token reuse
    // This check is not required for normal operation
    // Please keep this check in place for enhanced security and above the "generate new tokens" section.
    const securityCheck = await redisService.getValue(`revoked:${sessionId}`);
    if (securityCheck) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'revoked_session_reuse_attempt',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { sessionId }
      );
    
      throw monitoringManager.error.createError(
        'security',
        'SESSION_ALREADY_REVOKED',
        'Attempt to reuse revoked session',
        { sessionId }
      );
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: parsedSessionData.userId,
      email: parsedSessionData.email,
      title: parsedSessionData.title,
      tenantId: parsedSessionData.tenantId
    });

    const newRefreshToken = generateRefreshToken();
    const newSessionId = generateRefreshToken();

    // Store new tokens
    const tokenStoreStart = Date.now();
    await Promise.all([
      setRefreshToken(newSessionId, newRefreshToken),
      redisService.storeSession(newSessionId, JSON.stringify(parsedSessionData), 60 * 60 * 24)
    ]);

    // Record token storage performance
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'auth',
      'token_store_duration',
      Date.now() - tokenStoreStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId: parsedSessionData.userId }
    );

    const authResponse: AuthResponse = {
      user: parsedSessionData,
      session: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionId: newSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      onboardingComplete: parsedSessionData.onboardingStatus?.isOnboardingComplete || false,
      success: true,
      message: 'Tokens revoked and renewed successfully',
      context: {
        currentTenant: undefined, // Add appropriate context data here
        tenantOperations: {
          switchTenant: async (tenantId: string) => {
            // Implementation provided by client
          },
          getCurrentTenantRole: () => parsedSessionData.tenants.associations[parsedSessionData.tenants.context.currentTenantId]?.role,
          getCurrentTenantPermissions: () => parsedSessionData.tenants.associations[parsedSessionData.tenants.context.currentTenantId]?.permissions,
          isPersonalTenant: (tenantId: string) => tenantId === parsedSessionData.tenants.context.personalTenantId
        },
        tenantQueries: {
          getCurrentTenant: () => parsedSessionData.tenants.context.currentTenantId,
          getPersonalTenant: () => parsedSessionData.tenants.context.personalTenantId,
          getTenantRole: (tenantId: string) => parsedSessionData.tenants.associations[tenantId]?.role,
          getTenantPermissions: (tenantId: string) => parsedSessionData.tenants.associations[tenantId]?.permissions || [],
          hasActiveTenantAssociation: (tenantId: string) => parsedSessionData.tenants.associations[tenantId]?.status === 'active'
        }
      }
    };
  
    // Record final security metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'auth',
      'session_rotation_complete',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        oldSessionId: sessionId,
        newSessionId: newSessionId,
        userId: parsedSessionData.userId,
        totalDuration: Date.now() - startTime
      }
    );
    

    // Record success metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'token_revocation_success',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: parsedSessionData.userId,
        duration: Date.now() - startTime
      }
    );

    // Add just before the final return
    monitoringManager.logger.info('Token revocation and rotation completed successfully', {
      oldSessionId: sessionId,
      newSessionId: newSessionId,
      userId: parsedSessionData.userId,
      duration: Date.now() - startTime,
      operations: [
        'revocation',
        'cleanup',
        'rotation',
        'session_creation'
      ]
    });

    return res.status(200).json(authResponse);


  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'AUTH_REVOCATION_FAILED',
      'Error revoking tokens',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    // Record error metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'token_revocation_error',
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