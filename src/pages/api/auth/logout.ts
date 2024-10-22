// src/pages/api/auth/logout.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { blacklistToken, deleteRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';

async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { refreshToken, sessionId } = req.body;
  const accessToken = (req as any).user.token; // Access token from the decoded payload

  if (!refreshToken || !sessionId) {
    return res.status(400).json({ message: 'Refresh token and session ID are required' });
  }

  try {
    // Blacklist the access token
    await blacklistToken(accessToken);

    // Delete the refresh token
    await deleteRefreshToken(sessionId);

    // Update the user's last logout time in the database
    const userId = (req as any).user.userId;
    const client = await getCosmosClient();
    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS);
    
    await usersCollection.updateOne(
      { userId: userId },
      { $set: { lastLogout: new Date().toISOString() } }
    );

    logger.info(`User logged out successfully. User ID: ${userId}, Session ID: ${sessionId}`);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(new Error('Failed to logout'), { error });
    res.status(500).json({ message: 'Failed to logout', error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export default authMiddleware(logoutHandler);