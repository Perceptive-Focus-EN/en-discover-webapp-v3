// src/middlewares/authMiddleware.ts

import { NextApiRequest, NextApiResponse } from 'next';
import * as serverTokenUtils from '../utils/TokenManagement/serverTokenUtils';
import { redisService } from '../services/cache/redisService';
import { logger } from '../utils/ErrorHandling/logger';
import { UnauthorizedError } from '../errors/errors';

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export const authMiddleware = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('No authorization header provided');
      }

      const [bearer, token] = authHeader.split(' ');
      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedError('Invalid authorization header format');
      }

      const isBlacklisted = await serverTokenUtils.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedError('Token is blacklisted');
      }

      const decodedToken = serverTokenUtils.verifyAccessToken(token);
      if (!decodedToken) {
        throw new UnauthorizedError('Invalid token');
      }

      if (serverTokenUtils.isTokenExpired(token, 0)) {
        throw new UnauthorizedError('Token has expired');
      }

      // Check Redis for session data
      const sessionData = await redisService.getSession(token);
      if (!sessionData) {
        throw new UnauthorizedError('Invalid session');
      }

      // Parse the session data
      const sessionUser = JSON.parse(sessionData);

      // Attach both the decoded token and session user data to the request
      (req as any).user = {
        ...decodedToken,
        ...sessionUser
      };

      // Call the original handler
      return handler(req, res);
    } catch (error) {
      logger.error('Authentication error:', error);
      if (error instanceof UnauthorizedError) {
        return res.status(401).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};