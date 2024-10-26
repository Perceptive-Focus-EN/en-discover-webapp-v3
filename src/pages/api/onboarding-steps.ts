// pages/api/onboarding-steps.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { ONBOARDING_STEPS, ONBOARDING_STATUS } from '@/constants/onboarding';
import { COLLECTIONS } from '@/constants/collections';
import { ExtendedUserInfo } from '@/types/User/interfaces';
import { ObjectId } from 'mongodb';
import { WithId } from 'mongodb';
import { OnboardingStepRequest, OnboardingStepResponse, OnboardingStatusDetails, OnboardingStepName, OnboardingStep } from '@/types/Onboarding/interfaces';
import { ROLES } from '@/constants/AccessKey/AccountRoles';
import { ACCESS_LEVELS, AccessLevel } from '@/constants/AccessKey/access_levels';
import { authMiddleware } from '@/middlewares/authMiddleware';

const UPDATED_ONBOARDING_STEPS: OnboardingStepName[] = [
  'Verification',
  ...ONBOARDING_STEPS.filter(step => step !== 'Verification') as OnboardingStepName[]
];

async function onboardingStepsHandler(req: NextApiRequest, res: NextApiResponse<OnboardingStepResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method Not Allowed',
      user: null
    });
  }

  try {
    const USER_ID = (req as any).user.USER_ID;

    if (!ObjectId.isValid(USER_ID)) {
      return res.status(400).json({ message: 'Invalid USER_ID format', user: null });
    }

    const { step, DATA } = req.body as OnboardingStepRequest & { DATA: any };
    const stepName = step as OnboardingStepName;

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne<WithId<ExtendedUserInfo>>({ _id: new ObjectId(USER_ID) });
    if (!user) {
      return res.status(404).json({ message: 'User not found', user: null });
    }

    const currentOnboardingStatus = user.onboardingStatus as unknown as OnboardingStatusDetails || {
      steps: [],
      STAGE: 'INITIAL',
      isOnboardingComplete: false,
      LAST_UPDATED: '',
      CURRENT_STEP_INDEX: 0
    };

    const updatedOnboardingStatus: OnboardingStatusDetails = {
      ...currentOnboardingStatus,
      steps: UPDATED_ONBOARDING_STEPS.map(stepName => ({
        name: stepName,
        completed: currentOnboardingStatus.steps.find((s: OnboardingStep) => s.name === stepName)?.completed || false
      })),
      stage: ONBOARDING_STATUS[1] as 'in_progress',
      isOnboardingComplete: false,
      lastUpdated: new Date().toISOString(),
      currentStepIndex: UPDATED_ONBOARDING_STEPS.indexOf(stepName)
    };

    const stepIndex = UPDATED_ONBOARDING_STEPS.indexOf(stepName);
    if (stepIndex === -1) {
      return res.status(400).json({ message: 'Invalid step', user: null });
    }

    updatedOnboardingStatus.steps[stepIndex].completed = true;

    if (stepIndex === UPDATED_ONBOARDING_STEPS.length - 1) {
      updatedOnboardingStatus.isOnboardingComplete = true;
      updatedOnboardingStatus.stage = ONBOARDING_STATUS[2]; // Assuming this is 'COMPLETE'
    } else {
      updatedOnboardingStatus.currentStepIndex = stepIndex + 1;
    }

    const updateData: any = {
      ONBOARDING_STATUS: updatedOnboardingStatus,
      [`ONBOARDING_DATA.${step}`]: DATA,
    };

    // Update user info based on the step
    if (step === 'PersonalInfo') {
      const personalInfoData = DATA as { FIRST_NAME: string; LAST_NAME: string; DOB: string; PHONE: string };
      updateData.FIRST_NAME = personalInfoData.FIRST_NAME;
      updateData.LAST_NAME = personalInfoData.LAST_NAME;
      updateData.DOB = personalInfoData.DOB;
      updateData.PHONE = personalInfoData.PHONE;
    } else if (step === 'RoleSelection') {
      updateData.ROLE = (DATA as { ROLE: keyof typeof ROLES }).ROLE;
      updateData.ACCESS_LEVEL = (DATA as { ACCESS_LEVEL: AccessLevel }).ACCESS_LEVEL;
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(USER_ID) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(500).json({ message: 'Failed to update user', user: null });
    }

    return res.status(200).json({ 
      message: 'Onboarding step updated successfully', 
      user: createUserResponse(result.value) 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: `Error updating onboarding step: ${errorMessage}`, user: null });
  }
}

function createUserResponse(user: WithId<ExtendedUserInfo>): ExtendedUserInfo {
  return {
    userId: user.userId || '',
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    accessLevel: user.accessLevel,
    permissions: user.permissions || [],
    isActive: user.isActive || false,
    isVerified: user.isVerified || false,
    createdAt: user.createdAt || '',
    updatedAt: user.updatedAt || '',
    role: user.role || '',
    tenantId: user.tenantId || '',
    onboardingStatus: user.onboardingStatus || { STEPS: [], STAGE: 'INITIAL', IS_ONBOARDING_COMPLETE: false, LAST_UPDATED: '', CURRENT_STEP_INDEX: 0 },
    tenant: user.tenant || null,
    department: user.department || '',
    lastLogin: user.lastLogin || '',
    isDeleted: user.isDeleted || false,
    softDelete: user.softDelete || null,
    reminderSent: user.reminderSent || false,
    reminderSentAt: user.reminderSentAt || '',
    password: user.password || '',
    tenants: user.tenants || [],
    avatarUrl: user.avatarUrl || '',
    profile: user.profile || null,
    connections: user.connections || [],
    connectionRequests: user.connectionRequests || [],
    privacySettings: user.privacySettings || {},
    title: user.title || '',
    accountType: user.accountType || '',
    subscriptionType: user.subscriptionType || '',
    personalTenantId: user.personalTenantId || '',
    currentTenantId: user.currentTenantId || '',
    tenantAssociations: user.tenantAssociations || [],
  };
}

export default authMiddleware(onboardingStepsHandler);