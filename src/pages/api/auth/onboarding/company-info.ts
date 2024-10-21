// pages/api/auth/onboarding/company-info.ts


import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { ObjectId } from 'mongodb';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { CompanyInfoStepData } from '../../../../types/Onboarding/interfaces';
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

    const { userId, tenantId, companyName, companySize, industry, employeeCount, annualRevenue } = req.body as CompanyInfoStepData & { userId: string, tenantId: string };

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);
    
    const userResult = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          [`onboardingStatus.steps.${ONBOARDING_STEP_INDEX.CompanyInfo}.completed`]: true,
          'onboardingStatus.currentStepIndex': ONBOARDING_STEP_INDEX.RoleSelection,
          'onboardingStatus.stage': ONBOARDING_STATUS[1],
          'onboardingStatus.lastUpdated': new Date().toISOString(),
        }
      },
      { returnDocument: 'after' }
    );
      
    if (!userResult || !userResult.value) {
      return res.status(400).json({ message: 'Failed to update user onboarding status' });
    }

    await tenantsCollection.updateOne(
      { _id: new ObjectId(tenantId) },
      { 
        $set: { 
          companyName,
          companySize,
          industry,
          employeeCount,
          annualRevenue
        }
      }
    );

    res.status(200).json({ 
      message: 'Company info updated successfully',
      user: userResult.value
    });
  } catch (error) {
    logger.error('Error updating company info:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}