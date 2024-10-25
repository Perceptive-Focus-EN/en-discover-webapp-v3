// pages/api/auth/onboarding.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { OnboardingStepRequest, OnboardingStepResponse } from '../../../types/Onboarding/interfaces';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
import { SystemError, BusinessError, SecurityError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface OnboardingContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: OnboardingContext = {
  component: 'OnboardingHandler',
  systemId: process.env.SYSTEM_ID || 'onboarding-service',
  systemName: 'OnboardingService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    if (req.method !== 'POST') {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed',
        { method: req.method }
      );
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'No token provided'
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'Invalid token'
      );
    }

    const { userId, stage, step, data, tenantId } = req.body as OnboardingStepRequest;

    monitoringManager.logger.info('Processing onboarding step', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: {
        userId,
        stage,
        step,
        tenantId,
        requestId
      }
    });

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.USER_NOT_FOUND,
        'User not found',
        { userId }
      );
    }

    const stepIndex = API_ENDPOINTS.UPDATE_ONBOARDING_STEP.indexOf(step);
    if (stepIndex === -1) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Invalid onboarding step',
        { step, availableSteps: API_ENDPOINTS.UPDATE_ONBOARDING_STEP }
      );
    }

    const updateData: any = {
      [`onboardingStatus.steps.${stepIndex}.completed`]: true,
      'onboardingStatus.currentStepIndex': stepIndex + 1,
      'onboardingStatus.stage': stage,
      'onboardingStatus.lastUpdated': new Date().toISOString(),
    };

    Object.assign(updateData, data);

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.USER_UPDATE_FAILED,
        'Failed to update onboarding status',
        { userId, step }
      );
    }

    if (step === 'CompanyInfo') {
      const companyInfoData = data as { industry: string; employeeCount: number; annualRevenue: number };
      await tenantsCollection.updateOne(
        { _id: new ObjectId(tenantId) },
        { 
          $set: { 
            industry: companyInfoData.industry, 
            employeeCount: companyInfoData.employeeCount, 
            annualRevenue: companyInfoData.annualRevenue 
          } 
        }
      );

      monitoringManager.logger.info('Company info updated', {
        category: LogCategory.BUSINESS,
        pattern: LOG_PATTERNS.BUSINESS,
        metadata: {
          tenantId,
          industry: companyInfoData.industry,
          requestId
        }
      });
    }

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'onboarding',
      'step_completed',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        step,
        stage,
        duration: Date.now() - startTime,
        requestId
      }
    );

    const response: OnboardingStepResponse = {
      message: 'Onboarding step updated successfully',
      user: result.value
    };

    monitoringManager.logger.info('Onboarding step completed', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: {
        userId,
        step,
        stage,
        duration: Date.now() - startTime,
        requestId
      }
    });

    return res.status(200).json(response);

  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'onboarding',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        duration: Date.now() - startTime,
        requestId
      }
    );

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Error in onboarding process',
      { 
        error,
        requestId,
        duration: Date.now() - startTime
      }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}