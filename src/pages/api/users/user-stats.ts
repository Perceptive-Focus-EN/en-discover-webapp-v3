// src/pages/api/auth/user/user-stats.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '@/utils/ErrorHandling/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Unauthorized: No token provided');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decodedToken = verifyAccessToken(token);
  if (!decodedToken) {
    logger.warn('Unauthorized: Invalid token');
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const tenantId = decodedToken.tenantId;  // Ensure tenantId is part of your JWT

  try {
    logger.info('Fetching user stats for tenant', tenantId);
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Filter users by tenantId
    const totalUsers = await usersCollection.countDocuments({ tenantId });
    const activeUsers = await usersCollection.countDocuments({ tenantId, isActive: true });
    const onboardingUsers = await usersCollection.countDocuments({ tenantId, 'onboardingStatus.isOnboardingComplete': false });

    // Calculate user growth (implement based on actual logic or historical data)
    const userGrowth = calculateUserGrowth(tenantId); // Placeholder function for growth calculation

    logger.info(`User stats retrieved for tenant ${tenantId}: ${totalUsers} total, ${activeUsers} active, ${onboardingUsers} onboarding.`);

    res.status(200).json({
      totalUsers,
      activeUsers,
      onboardingUsers,
      userGrowth
    });
  } catch (error) {
    logger.error(new Error('Error fetching user stats for tenant'), { tenantId, error });
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
}

function calculateUserGrowth(tenantId: string): number {
  // Implement logic to calculate user growth based on historical data or trends.
  // This can involve querying past user data and computing the percentage change.
  return 2.5; // Placeholder example
}
