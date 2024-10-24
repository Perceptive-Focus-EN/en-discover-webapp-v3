import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { redisService } from '../../services/cache/redisService';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

// Constants
const TOKEN_CONSTANTS = {
  REFRESH_PREFIX: 'refresh:',
  REFRESH_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
  BLACKLIST_PREFIX: 'blacklist:',
  EMAIL_VERIFICATION_PREFIX: 'email_verification:',
  EMAIL_VERIFICATION_EXPIRY: 24 * 3600, // 24 hours
  ACCESS_TOKEN_EXPIRY: '120m'
} as const;

// Type definitions
interface DecodedToken {
  userId: string;
  email: string;
  exp?: number;
}

interface EmailVerificationPayload {
  userId: string;
  email: string;
  verificationToken: string;
}

interface TokenData {
  [key: string]: any;
  tb?: string;
}

// Validation
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

// Utility functions
const createTokenBindingId = (clientPublicKey: string): string => 
  `sha256-${crypto.createHash('sha256').update(clientPublicKey).digest('base64')}`;

// Token generation functions
export const generateAccessToken = (sessionData: TokenData, clientPublicKey?: string): string => {
  const tokenData: TokenData = { ...sessionData };
  if (clientPublicKey) {
    tokenData.tb = createTokenBindingId(clientPublicKey);
  }
  return jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: TOKEN_CONSTANTS.ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (): string => uuidv4();

export const generateEmailVerificationToken = (payload: EmailVerificationPayload): string => 
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });

// Token verification functions
export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string, storedToken: string): boolean => token === storedToken;

export const verifyEmailToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
};

// Token expiration checks
export const isTokenExpired = (token: string): boolean => {
  if (!token) {
    return true;
  }

  try {
    const decoded = jwt.decode(token) as DecodedToken;
    if (decoded?.exp) {
      return Date.now() >= decoded.exp * 1000;
    }
    return true;
  } catch (error) {
    return true;
  }
};

// Redis operations for refresh tokens
export const setRefreshToken = async (sessionId: string, refreshToken: string): Promise<void> => {
  const startTime = Date.now();
  try {
    await redisService.setValue(
      `${TOKEN_CONSTANTS.REFRESH_PREFIX}${sessionId}`, 
      refreshToken, 
      TOKEN_CONSTANTS.REFRESH_EXPIRY
    );
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_set',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        sessionId,
        duration: Date.now() - startTime
      }
    );
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'set',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error setting refresh token',
      { sessionId, error }
    );
  }
};

export const getRefreshToken = async (sessionId: string): Promise<string | null> => {
  const startTime = Date.now();
  try {
    const token = await redisService.getValue(`${TOKEN_CONSTANTS.REFRESH_PREFIX}${sessionId}`);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_get',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        sessionId,
        found: !!token,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Refresh token retrieval', {
      sessionId,
      found: !!token
    });

    return token;
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'get',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error getting refresh token',
      { sessionId, error }
    );
  }
};

export const deleteRefreshToken = async (sessionId: string): Promise<void> => {
  const startTime = Date.now();
  try {
    await redisService.deleteValue(`${TOKEN_CONSTANTS.REFRESH_PREFIX}${sessionId}`);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_delete',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        sessionId,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Deleted refresh token for session', { sessionId });
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'delete',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error deleting refresh token',
      { sessionId, error }
    );
  }
};

export const rotateRefreshToken = async (sessionId: string): Promise<string> => {
  const startTime = Date.now();
  try {
    const newRefreshToken = generateRefreshToken();
    await setRefreshToken(sessionId, newRefreshToken);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_rotate',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        sessionId,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Rotated refresh token for session', { sessionId });
    return newRefreshToken;
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'refresh_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'rotate',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error rotating refresh token',
      { sessionId, error }
    );
  }
};

// Blacklist operations
export const blacklistToken = async (token: string): Promise<void> => {
  const startTime = Date.now();
  try {
    await redisService.setValue(
      `${TOKEN_CONSTANTS.BLACKLIST_PREFIX}${token}`,
      'blacklisted', 
      24 * 60 * 60
    );
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'blacklist_token_set',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        token,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Token added to blacklist', { token });
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'blacklist_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'set',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error blacklisting token',
      { token, error }
    );
  }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const startTime = Date.now();
  try {
    const blacklisted = await redisService.getValue(`${TOKEN_CONSTANTS.BLACKLIST_PREFIX}${token}`);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'blacklist_token_check',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        token,
        blacklisted: !!blacklisted,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Checked blacklist status for token', { token, blacklisted: !!blacklisted });
    return blacklisted !== null;
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'blacklist_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'check',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error checking if token is blacklisted',
      { token, error }
    );
  }
};

// Email verification token operations
export const setEmailVerificationToken = async (userId: string, token: string): Promise<void> => {
  const startTime = Date.now();
  try {
    await redisService.setValue(
      `${TOKEN_CONSTANTS.EMAIL_VERIFICATION_PREFIX}${userId}`, 
      token, 
      TOKEN_CONSTANTS.EMAIL_VERIFICATION_EXPIRY
    );
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'email_verification_token_set',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Set email verification token for user', { userId });
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'email_verification_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'set',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error setting email verification token',
      { userId, error }
    );
  }
};

export const getEmailVerificationToken = async (userId: string): Promise<string | null> => {
  const startTime = Date.now();
  try {
    const token = await redisService.getValue(`${TOKEN_CONSTANTS.EMAIL_VERIFICATION_PREFIX}${userId}`);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'email_verification_token_get',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        found: !!token,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Retrieved email verification token for user', { userId, found: !!token });
    return token;
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'email_verification_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'get',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error getting email verification token',
      { userId, error }
    );
  }
};

export const blacklistEmailVerificationToken = async (userId: string): Promise<void> => {
  const startTime = Date.now();
  try {
    await redisService.deleteValue(`${TOKEN_CONSTANTS.EMAIL_VERIFICATION_PREFIX}${userId}`);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'email_verification_token_blacklist',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Blacklisted email verification token for user', { userId });
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'email_verification_token_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'blacklist',
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    
    throw monitoringManager.error.createError(
      'security',
      'TOKEN_OPERATION_FAILED',
      'Error blacklisting email verification token',
      { userId, error }
    );
  }
};
