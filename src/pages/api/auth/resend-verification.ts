// src/pages/api/auth/resend-verification.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { generateEmailVerificationToken, setEmailVerificationToken } from '../../../utils/emailUtils';
import { sendVerificationEmail } from '../../../services/emailService';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError, SecurityError, BusinessError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface ResendVerificationContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: ResendVerificationContext = {
  component: 'ResendVerificationHandler',
  systemId: process.env.SYSTEM_ID || 'auth-service',
  systemName: 'AuthenticationService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = crypto.randomUUID();

  monitoringManager.logger.info('Resend verification handler invoked', {
    category: LogCategory.SYSTEM,
    pattern: LOG_PATTERNS.SYSTEM,
    metadata: { requestId }
  });

  if (process.env.NODE_ENV === 'development') {
    monitoringManager.logger.debug('Incoming headers', {
      category: LogCategory.SYSTEM,
      pattern: LOG_PATTERNS.SYSTEM,
      metadata: { headers: req.headers, requestId }
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    monitoringManager.logger.warn('No token provided', {
      category: LogCategory.SECURITY,
      pattern: LOG_PATTERNS.SECURITY
    });
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      monitoringManager.logger.warn('Invalid token provided', {
        category: LogCategory.SECURITY,
        pattern: LOG_PATTERNS.SECURITY,
        metadata: { requestId }
      });
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decoded.userId;

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ userId: userId });

    if (!user) {
      monitoringManager.logger.warn('User not found', {
        category: LogCategory.BUSINESS,
        pattern: LOG_PATTERNS.BUSINESS,
        metadata: { userId, requestId }
      });
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      monitoringManager.logger.info('User already verified', {
        category: LogCategory.BUSINESS,
        pattern: LOG_PATTERNS.BUSINESS,
        metadata: { userId, requestId }
      });
      return res.status(400).json({ message: 'User is already verified' });
    }

    const verificationToken = generateEmailVerificationToken({ 
      userId: user.userId,
      email: user.email
    });
    
    await setEmailVerificationToken(userId, verificationToken);

    await usersCollection.updateOne(
      { userId: userId },
      { $set: { verificationToken: verificationToken } }
    );

    await sendVerificationEmail({
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      additionalData: { verificationToken }
    });

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'email',
      'verification_resent',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        requestId,
        success: true
      }
    );

    monitoringManager.logger.info('Verification email resent successfully', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: { userId, requestId }
    });

    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    monitoringManager.logger.error(
      error instanceof Error ? error : new Error('Error resending verification email'),
      BusinessError.NOTIFICATION_SEND_FAILED,
      {
        category: LogCategory.SYSTEM,
        pattern: LOG_PATTERNS.SYSTEM,
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId
        }
      }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'email',
      'verification_resend_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        requestId
      }
    );

    res.status(500).json({ message: 'Internal server error' });
  }
}