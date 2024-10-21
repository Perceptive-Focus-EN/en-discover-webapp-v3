// pages/api/auth/onboarding.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { ObjectId } from 'mongodb';
import { logger } from '../../../utils/ErrorHandling/logger';
import { OnboardingStepName, OnboardingStepData, OnboardingStepRequest, OnboardingStepResponse } from '../../../types/Onboarding/interfaces';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';

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

    const { userId, stage, step, data, tenantId } = req.body as OnboardingStepRequest;

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stepIndex = API_ENDPOINTS.UPDATE_ONBOARDING_STEP.indexOf(step);
    if (stepIndex === -1) {
      return res.status(400).json({ message: 'Invalid onboarding step' });
    }

    const updateData: any = {
      [`onboardingStatus.steps.${stepIndex}.completed`]: true,
      'onboardingStatus.currentStepIndex': stepIndex + 1,
      'onboardingStatus.stage': stage,
      'onboardingStatus.lastUpdated': new Date().toISOString(),
    };

    // Add step-specific data to updateData
    Object.assign(updateData, data);

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(400).json({ message: 'Failed to update onboarding status' });
    }

    // If it's a company info step, update tenant information
    if (step === 'CompanyInfo') {
      const companyInfoData = data as { industry: string; employeeCount: number; annualRevenue: number };
      await tenantsCollection.updateOne(
        { _id: new ObjectId(tenantId) },
        { $set: { industry: companyInfoData.industry, employeeCount: companyInfoData.employeeCount, annualRevenue: companyInfoData.annualRevenue } }
      );
    }

    const response: OnboardingStepResponse = {
      message: 'Onboarding step updated successfully',
      user: result.value
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error in onboarding process:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}
