// src/pages/api/auth/refresh.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  getRefreshToken, 
  setRefreshToken, 
  blacklistToken, 
  deleteRefreshToken, 
  isTokenExpired, 
  isTokenBlacklisted 
} from '../../../utils/TokenManagement/serverTokenUtils';
import { AuthResponse } from '../../../types/Login/interfaces';
import { logger } from '../../../utils/ErrorHandling/logger';
import { redisService } from '../../../services/cache/redisService';

export default async function refreshHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { refreshToken, sessionId } = req.body;

  if (!refreshToken || !sessionId) {
    return res.status(400).json({ error: 'Refresh token and session ID are required' });
  }

  try {
    const storedToken = await getRefreshToken(sessionId);

    if (!storedToken || isTokenExpired(storedToken)) {
      return res.status(403).json({ error: 'Refresh token expired or invalid' });
    }

    if (await isTokenBlacklisted(storedToken)) {
      return res.status(403).json({ error: 'Refresh token is blacklisted' });
    }

    // Token reuse detection
    if (refreshToken !== storedToken) {
      await blacklistToken(storedToken);
      await deleteRefreshToken(sessionId);
      return res.status(403).json({ error: 'Refresh token reuse detected' });
    }

    if (!verifyRefreshToken(refreshToken, storedToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Retrieve session data
    const sessionData = await redisService.getSession(sessionId);
    if (!sessionData) {
      return res.status(403).json({ error: 'Invalid session' });
    }

    const parsedSessionData = JSON.parse(sessionData);

    // Generate new access and refresh tokens
    const newAccessToken = generateAccessToken({
      userId: parsedSessionData.userId,
      email: parsedSessionData.email,
      title: parsedSessionData.title, // Changed from 'role' to 'title'
      tenantId: parsedSessionData.tenantId
    });
    const newRefreshToken = generateRefreshToken();
    const newSessionId = generateRefreshToken(); // This uses uuidv4 internally

    // Store new refresh token and session data
    await setRefreshToken(newSessionId, newRefreshToken);
    await redisService.storeSession(newSessionId, JSON.stringify(parsedSessionData), 60 * 60 * 24); // 24 hours

    const authResponse: AuthResponse = {
      success: true,
      message: 'Tokens refreshed successfully',
      user: parsedSessionData,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
      onboardingComplete: parsedSessionData.onboardingStatus?.isOnboardingComplete || false, // Changed from 'status' to 'isOnboardingComplete'
      permissions: [] // Changed from 'permission' to 'permissions'
    };

    res.status(200).json(authResponse);
  } catch (error) {
    logger.error(new Error('Error refreshing token'), { error });
    res.status(500).json({ error: 'Failed to refresh tokens' });
  }
}