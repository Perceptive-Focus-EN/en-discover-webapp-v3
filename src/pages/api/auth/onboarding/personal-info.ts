// pages/api/auth/onboarding/personal-info.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { ObjectId } from 'mongodb';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { PersonalInfoStepData } from '../../../../types/Onboarding/interfaces';
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

    const { userId, firstName, lastName, email, dob, phone } = req.body as PersonalInfoStepData & { userId: string };

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

        const result = await usersCollection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
        $set: {
          firstName,
          lastName,
          email,
          dob,
          phone,
          [`onboardingStatus.steps.${ONBOARDING_STEP_INDEX.PersonalInfo}.completed`]: true,
          'onboardingStatus.currentStepIndex': ONBOARDING_STEP_INDEX.CompanyInfo,
          'onboardingStatus.stage': ONBOARDING_STATUS[1],
          'onboardingStatus.lastUpdated': new Date().toISOString(),
        }
      },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(400).json({ message: 'Failed to update personal info' });
    }

    res.status(200).json({ 
      message: 'Personal info updated successfully',
      user: result.value
    });
  } catch (error) {
    logger.error('Error updating personal info:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}