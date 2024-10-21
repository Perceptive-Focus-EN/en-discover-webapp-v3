// // src/utils/TokenManagement/serverTokenUtils.tsx

// import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';
// import crypto from 'crypto';
// import { logger } from '../utils/ErrorHandling/logger';
// import { redisService } from '../services/cache/redisService';

// const REFRESH_PREFIX = 'refresh:';
// const REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
// const BLACKLIST_PREFIX = 'blacklist:';
// const EMAIL_VERIFICATION_PREFIX = 'email_verification:';
// const EMAIL_VERIFICATION_EXPIRY = 24 * 3600; // 24 hours in seconds

// // Ensure JWT_SECRET is defined
// if (!process.env.JWT_SECRET) {
//   throw new Error('JWT_SECRET environment variable is not set.');
// }

// interface DecodedToken {
//   userId: string;
//   email: string;
// }

// interface EmailVerificationPayload {
//   userId: string;
//   email: string;
//   verificationToken: string;
// }

// export const generateAccessToken = (sessionData: any, clientPublicKey?: string): string => {
//   let tokenData = { ...sessionData };
//   if (clientPublicKey) {
//     const tokenBindingId = createTokenBindingId(clientPublicKey);
//     tokenData = { ...tokenData, tb: tokenBindingId };
//   }
//   return jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: '15m' });
// };

// export const createTokenBindingId = (clientPublicKey: string): string => {
//   return `sha256-${crypto.createHash('sha256').update(clientPublicKey).digest('base64')}`;
// };

// export const generateRefreshToken = (): string => {
//   return uuidv4();
// };

// export const verifyAccessToken = (token: string): any => {
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET!);
//   } catch (error) {
//     logger.error('Access token verification failed:', { error });
//     return null;
//   }
// };

// export const isTokenExpired = (token: string): boolean => {
//   if (!token) {
//     logger.warn('Attempted to check expiration of null or undefined token');
//     return true;
//   }
//   try {
//     const decoded = jwt.decode(token) as { exp: number };
//     if (decoded && decoded.exp) {
//       const isExpired = Date.now() >= decoded.exp * 1000;
//       if (isExpired) {
//         logger.info('Token expired');
//       }
//       return isExpired;
//     }
//     logger.warn('Token does not contain expiration information');
//     return true;
//   } catch (error) {
//     logger.error('Token parsing failed:', { error });
//     return true;
//   }
// };

// export const verifyRefreshToken = async (token: string, sessionId: string): Promise<boolean> => {
//   const storedToken = await redisService.getRefreshToken(sessionId);
//   return token === storedToken;
// };

// export const setRefreshToken = async (sessionId: string, refreshToken: string): Promise<void> => {
//   await redisService.storeRefreshToken(sessionId, refreshToken);
// };

// export const getRefreshToken = async (sessionId: string): Promise<string | null> => {
//   return redisService.getRefreshToken(sessionId);
// };

// export const deleteRefreshToken = async (sessionId: string): Promise<void> => {
//   await redisService.deleteRefreshToken(sessionId);
// };

// export const rotateRefreshToken = async (sessionId: string): Promise<string> => {
//   const newRefreshToken = generateRefreshToken();
//   await setRefreshToken(sessionId, newRefreshToken);
//   logger.info(`Rotated refresh token for session: ${sessionId}`);
//   return newRefreshToken;
// };

// export const blacklistToken = async (token: string): Promise<void> => {
//   await redisService.setValue(`${BLACKLIST_PREFIX}${token}`, 'blacklisted', 24 * 60 * 60); // 24 hours TTL
// };

// export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
//   const blacklisted = await redisService.getValue(`${BLACKLIST_PREFIX}${token}`);
//   return blacklisted !== null;
// };

// // Email verification functions

// export const generateEmailVerificationToken = (payload: EmailVerificationPayload): string => {
//   return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
// };

// export const setEmailVerificationToken = async (userId: string, token: string): Promise<void> => {
//   await redisService.setValue(`${EMAIL_VERIFICATION_PREFIX}${userId}`, token, EMAIL_VERIFICATION_EXPIRY);
// };

// export const getEmailVerificationToken = async (userId: string): Promise<string | null> => {
//   return redisService.getValue(`${EMAIL_VERIFICATION_PREFIX}${userId}`);
// };

// export const verifyEmailToken = (token: string): DecodedToken | null => {
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
//   } catch (error) {
//     logger.error('Error verifying email token:', { error });
//     return null;
//   }
// };

// export const blacklistEmailVerificationToken = async (userId: string): Promise<void> => {
//   await redisService.deleteValue(`${EMAIL_VERIFICATION_PREFIX}${userId}`);
// };