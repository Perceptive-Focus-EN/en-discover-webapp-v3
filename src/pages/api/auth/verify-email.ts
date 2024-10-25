// src/pages/api/auth/verify-email.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyEmailToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError, BusinessError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface EmailVerificationContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: EmailVerificationContext = {
  component: 'EmailVerificationHandler',
  systemId: process.env.SYSTEM_ID || 'auth-service',
  systemName: 'AuthenticationService',
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
        'Method not allowed. Use POST for email verification.',
        { method: req.method }
      );
    }

    const { verificationToken } = req.body;
    if (!verificationToken) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Verification token is required'
      );
    }

    // Verify the JWT token
    const decodedToken = verifyEmailToken(verificationToken);
    if (!decodedToken) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid or expired verification token',
        { tokenProvided: !!verificationToken }
      );
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Find user by userId from the decoded token and verificationToken
    const user = await usersCollection.findOne({ 
      userId: decodedToken.userId,
      verificationToken: verificationToken
    });

    if (!user) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.USER_NOT_FOUND,
        'Invalid verification token',
        { userId: decodedToken.userId }
      );
    }

    if (user.isVerified) {
      monitoringManager.logger.info('Email already verified', {
        category: LogCategory.BUSINESS,
        pattern: LOG_PATTERNS.BUSINESS,
        metadata: {
          userId: decodedToken.userId,
          requestId
        }
      });
      return res.status(200).json({ message: 'Email is already verified.' });
    }

    try {
      const updateResult = await usersCollection.updateOne(
        { userId: decodedToken.userId },
        { 
          $set: { 
            isVerified: true,
            'onboardingStatus.steps.0.completed': true,
            'onboardingStatus.currentStepIndex': 1
          },
          $unset: { verificationToken: "" }
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'email',
        'verification_attempt',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          success: updateResult.modifiedCount > 0,
          userId: decodedToken.userId,
          requestId
        }
      );

      if (updateResult.matchedCount === 0) {
        throw monitoringManager.error.createError(
          'business',
          BusinessError.USER_NOT_FOUND,
          'User not found for update',
          { userId: decodedToken.userId }
        );
      }

      if (updateResult.modifiedCount === 0) {
        throw monitoringManager.error.createError(
          'business',
          BusinessError.USER_UPDATE_FAILED,
          'User found but not modified',
          { 
            userId: decodedToken.userId,
            reason: 'possibly_already_verified' 
          }
        );
      }

      monitoringManager.logger.info('Email verified successfully', {
        category: LogCategory.BUSINESS,
        pattern: LOG_PATTERNS.BUSINESS,
        metadata: {
          userId: decodedToken.userId,
          duration: Date.now() - startTime,
          requestId
        }
      });

      return res.status(200).json({ 
        message: 'Email verified successfully. You can now proceed with your account.' 
      });

    } catch (updateError) {
      throw monitoringManager.error.createError(
        'system',
        SystemError.DATABASE_OPERATION_FAILED,
        'Failed to update user verification status',
        { 
          error: updateError,
          userId: decodedToken.userId,
          duration: Date.now() - startTime
        }
      );
    }

  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'email',
      'verification_error',
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
      'Email verification process failed',
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