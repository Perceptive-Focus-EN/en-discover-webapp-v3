// src/pages/api/auth/revoke.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  blacklistToken, 
  generateAccessToken, 
  generateRefreshToken, 
  setRefreshToken,
  deleteRefreshToken
} from '../../../utils/TokenManagement/serverTokenUtils';
import { AuthResponse } from '../../../types/Login/interfaces';
import { logger } from '../../../utils/ErrorHandling/logger';
import { redisService } from '../../../services/cache/redisService';

export default async function revokeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { refreshToken, sessionId } = req.body;

  if (!refreshToken || !sessionId) {
    return res.status(400).json({ error: 'Refresh token and session ID are required' });
  }

  try {
    // Revoke old tokens
    await blacklistToken(refreshToken);
    await deleteRefreshToken(sessionId);

    // Retrieve session data
    const sessionData = await redisService.getSession(sessionId);
    if (!sessionData) {
      return res.status(403).json({ error: 'Invalid session' });
    }

    const parsedSessionData = JSON.parse(sessionData);

    // Generate new tokens
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
      user: parsedSessionData,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
      onboardingComplete: parsedSessionData.onboardingStatus?.isOnboardingComplete || false, // Changed from 'status' to 'isOnboardingComplete'
      success: true,
      message: 'Tokens revoked and renewed successfully',
      permissions: [] // Changed from 'permission' to 'permissions'
    };

    res.status(200).json(authResponse);
  } catch (error) {
    logger.error('Error revoking tokens:', error);
    res.status(500).json({ error: 'Failed to revoke tokens' });
  }
}