// pages/api/auth/onboarding/financial-info.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { ObjectId } from 'mongodb';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { FinancialInfoStepData } from '../../../../types/Onboarding/interfaces';

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

    const { userId, ...financialData } = req.body as FinancialInfoStepData & { userId: string };

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          ...financialData,
          'onboardingStatus.steps.5.completed': true,
          'onboardingStatus.currentStepIndex': 6,
          'onboardingStatus.lastUpdated': new Date().toISOString(),
        }
      },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(400).json({ message: 'Failed to update financial info' });
    }

    res.status(200).json({
      message: 'Financial info updated successfully',
      user: result.value
    });
  } catch (error) {
    logger.error('Error updating financial info:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}