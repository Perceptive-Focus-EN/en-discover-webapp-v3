// src/utils/serverTokenUtils.ts

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from '../ErrorHandling/logger';
import { redisService } from '../../services/cache/redisService';

const REFRESH_PREFIX = 'refresh:';
const REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const BLACKLIST_PREFIX = 'blacklist:';
const EMAIL_VERIFICATION_PREFIX = 'email_verification:';
const EMAIL_VERIFICATION_EXPIRY = 24 * 3600; // 24 hours in seconds

// Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

interface DecodedToken {
  userId: string;
  email: string;
}

interface EmailVerificationPayload {
  userId: string;
  email: string;
  verificationToken: string;
}

export const generateAccessToken = (sessionData: any, clientPublicKey?: string): string => {
  let tokenData = { ...sessionData };
  if (clientPublicKey) {
    const tokenBindingId = createTokenBindingId(clientPublicKey);
    tokenData = { ...tokenData, tb: tokenBindingId };
  }
  return jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: '15m' });
};

export const createTokenBindingId = (clientPublicKey: string): string => {
  return `sha256-${crypto.createHash('sha256').update(clientPublicKey).digest('base64')}`;
};

export const generateRefreshToken = (): string => {
  return uuidv4();
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    logger.error('Access token verification failed:', { error });
    return null;
  }
};

export const isTokenExpired = (token: string, p0: number): boolean => {
  if (!token) {
    logger.warn('Attempted to check expiration of null or undefined token');
    return true;
  }
  try {
    const decoded = jwt.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
        logger.info('Token expired');
      }
      return isExpired;
    }
    logger.warn('Token does not contain expiration information');
    return true;
  } catch (error) {
    logger.error('Token parsing failed:', { error });
    return true;
  }
};

export const verifyRefreshToken = (token: string, storedToken: string): boolean => {
  return token === storedToken;
};

export const setRefreshToken = async (sessionId: string, refreshToken: string): Promise<void> => {
  try {
    await redisService.storeRefreshToken(sessionId, refreshToken);
    logger.info(`Set refresh token for session: ${sessionId}`);
    logger.increment('refresh_token_set');
  } catch (error) {
    logger.error(`Error setting refresh token for session: ${sessionId}`, { error });
    logger.increment('refresh_token_set_error');
    throw error;
  }
};

export const getRefreshToken = async (sessionId: string): Promise<string | null> => {
  try {
    const token = await redisService.getRefreshToken(sessionId);
    if (token) {
      logger.info(`Retrieved refresh token for session: ${sessionId}`);
      logger.increment('refresh_token_retrieved');
    } else {
      logger.info(`No refresh token found for session: ${sessionId}`);
      logger.increment('refresh_token_not_found');
    }
    return token;
  } catch (error) {
    logger.error(`Error getting refresh token for session: ${sessionId}`, { error });
    logger.increment('refresh_token_retrieval_error');
    throw error;
  }
};

export const deleteRefreshToken = async (sessionId: string): Promise<void> => {
  try {
    await redisService.deleteRefreshToken(sessionId);
    logger.info(`Deleted refresh token for session: ${sessionId}`);
    logger.increment('refresh_token_deleted');
  } catch (error) {
    logger.error(`Error deleting refresh token for session: ${sessionId}`, { error });
    logger.increment('refresh_token_deletion_error');
    throw error;
  }
};

export const rotateRefreshToken = async (sessionId: string): Promise<string> => {
  const newRefreshToken = generateRefreshToken();
  await setRefreshToken(sessionId, newRefreshToken);
  logger.info(`Rotated refresh token for session: ${sessionId}`);
  return newRefreshToken;
};

export const blacklistToken = async (token: string): Promise<void> => {
  try {
    await redisService.setValue(`${BLACKLIST_PREFIX}${token}`, 'blacklisted', 24 * 60 * 60); // 24 hours TTL
    logger.info('Token added to blacklist');
  } catch (error) {
    logger.error('Error blacklisting token:', { token, error });
    logger.increment('blacklist_token_error');
    throw error;
  }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const blacklisted = await redisService.getValue(`${BLACKLIST_PREFIX}${token}`);
    logger.info(`Checked blacklist status for token`);
    return blacklisted !== null;
  } catch (error) {
    logger.error('Error checking if token is blacklisted:', { token, error });
    logger.increment('is_token_blacklisted_error');
    throw error;
  }
};

export const checkRefreshTokenExpiration = (storedToken: string): boolean => {
  return isTokenExpired(storedToken, 0);
};

// <------------- EMAIL TOKENING BELOW THIS LINE ----------->

export const generateEmailVerificationToken = (payload: EmailVerificationPayload): string => {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
  return token;
};

export const setEmailVerificationToken = async (userId: string, token: string): Promise<void> => {
  try {
    await redisService.setValue(`${EMAIL_VERIFICATION_PREFIX}${userId}`, token, EMAIL_VERIFICATION_EXPIRY);
    logger.info(`Set email verification token for user: ${userId}`);
    logger.increment('email_verification_token_set');
  } catch (error) {
    logger.error(`Error setting email verification token for user: ${userId}`, { error });
    logger.increment('email_verification_token_set_error');
    throw error;
  }
};

export const getEmailVerificationToken = async (userId: string): Promise<string | null> => {
  try {
    const token = await redisService.getValue(`${EMAIL_VERIFICATION_PREFIX}${userId}`);
    if (token) {
      logger.info(`Retrieved email verification token for user: ${userId}`);
      logger.increment('email_verification_token_retrieved');
    } else {
      logger.info(`No email verification token found for user: ${userId}`);
      logger.increment('email_verification_token_not_found');
    }
    return token;
  } catch (error) {
    logger.error(`Error getting email verification token for user: ${userId}`, { error });
    logger.increment('email_verification_token_retrieval_error');
    throw error;
  }
};

export const verifyEmailToken = (token: string): { userId: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    logger.error('Error verifying email token:', { error });
    return null;
  }
};

export const blacklistEmailVerificationToken = async (userId: string): Promise<void> => {
  try {
    await redisService.deleteValue(`${EMAIL_VERIFICATION_PREFIX}${userId}`);
    logger.info(`Blacklisted email verification token for user: ${userId}`);
    logger.increment('email_verification_token_blacklisted');
  } catch (error) {
    logger.error(`Error blacklisting email verification token for user: ${userId}`, { error });
    logger.increment('email_verification_token_blacklist_error');
    throw error;
  }
};
