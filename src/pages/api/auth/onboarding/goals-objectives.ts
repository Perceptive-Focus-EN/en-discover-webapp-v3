// pages/api/auth/onboarding/goals-objectives.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { GoalsAndObjectivesStepData } from '../../../../types/Onboarding/interfaces';
import { ONBOARDING_STEP_INDEX, ONBOARDING_STATUS } from '../../../../constants/onboarding';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { userId, ...goalsData } = req.body as GoalsAndObjectivesStepData & { userId: string };

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const result = await usersCollection.findOneAndUpdate(
      { userId: userId },
      { 
        $set: {
          ...goalsData,
          [`onboardingStatus.steps.${ONBOARDING_STEP_INDEX.FinancialInfo}.completed`]: true,
          'onboardingStatus.currentStepIndex': ONBOARDING_STEP_INDEX.Complete,
          'onboardingStatus.stage': ONBOARDING_STATUS[1],
          'onboardingStatus.lastUpdated': new Date().toISOString(),
        }
      },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(400).json({ message: 'Failed to update goals and objectives' });
    }

    res.status(200).json({ 
      message: 'Goals and objectives updated successfully',
      user: result.value
    });
  } catch (error) {
    logger.error('Error updating goals and objectives:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}