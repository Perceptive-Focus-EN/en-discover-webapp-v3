import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { authMiddleware } from '../../../../middlewares/authMiddleware';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    const appError = monitoringManager.error.createError(
      'business',
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      { method: req.method }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  const { tenantId } = req.query;
  const { nfcId } = req.body;

  if (!tenantId || !nfcId) {
    const appError = monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Missing required parameters',
      { tenantId, nfcId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Record NFC access attempt
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'nfc',
      'access_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        tenantId,
        nfcId
      }
    );

    const user = await usersCollection.findOne({ 
      currentTenantId: tenantId, 
      nfcId: nfcId 
    });

    const duration = Date.now() - startTime;

    if (user) {
      // Record successful access
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'nfc',
        'access_granted',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          tenantId,
          nfcId,
          userId: user.userId,
          duration
        }
      );

      // Record access latency
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'nfc',
        'access_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          tenantId,
          success: true
        }
      );

      return res.status(200).json({
        accessGranted: true,
        userData: {
          name: `${user.firstName} ${user.lastName}`,
          role: user.title,
          department: user.accountType,
        }
      });
    } 

    // Record denied access
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'nfc',
      'access_denied',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        tenantId,
        nfcId,
        duration
      }
    );

    // Record access latency even for denials
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'nfc',
      'access_duration',
      duration,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        tenantId,
        success: false
      }
    );

    return res.status(200).json({ accessGranted: false });

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const appError = monitoringManager.error.createError(
      'system',
      'NFC_ACCESS_ERROR',
      'Error processing NFC access',
      { error, tenantId, nfcId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    // Record error metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'nfc',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'access',
        errorType: error.name || 'unknown',
        tenantId,
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

export default authMiddleware(handler);