import type { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyAccessToken, isTokenBlacklisted } from '../../../utils/TokenManagement/serverTokenUtils';
import { MoodEntry } from '../../../components/EN/types/moodHistory';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

const SKIP_AUTH_IN_DEV = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    const appError = monitoringManager.error.createError(
      'business',
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      { method: req.method }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    res.setHeader('Allow', ['POST']);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  let userId = 'CandyUserId';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment || !SKIP_AUTH_IN_DEV) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        const appError = monitoringManager.error.createError(
          'security',
          'AUTH_UNAUTHORIZED',
          'No token provided'
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }

      const decodedToken = verifyAccessToken(token);
      if (!decodedToken || !decodedToken.userId) {
        const appError = monitoringManager.error.createError(
          'security',
          'AUTH_TOKEN_INVALID',
          'Invalid token or missing user ID'
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }

      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        const appError = monitoringManager.error.createError(
          'security',
          'AUTH_TOKEN_REVOKED',
          'Token has been revoked'
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }

      userId = decodedToken.userId;
    } catch (error) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_FAILED',
        'Authentication failed',
        { error }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }
  }

  try {
    const { emotionId, color, volume, sources, date, tenantId } = req.body as Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>;

    if (!emotionId || !color || !volume || !sources || !date || !tenantId) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Missing required fields',
        { emotionId, color, volume, sources, date, tenantId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const { db } = await getCosmosClient();
    const collection = db.collection(COLLECTIONS.MOODENTRY);
    const formattedDate = new Date(date).toISOString().split('T')[0];

    const newMoodEntry = {
      emotionId,
      color,
      volume,
      sources,
      timeStamp: new Date().toISOString(),
    };

    const operationStart = Date.now();
    const result = await collection.updateOne(
      {
        userId,
        tenantId,
        date: formattedDate
      },
      {
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
        $set: {
          updatedAt: new Date().toISOString(),
        },
        $push: {
          entries: newMoodEntry
        } as any
      },
      { upsert: true }
    );

    // Record performance metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'mood_entry',
      'save_duration',
      Date.now() - operationStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        userId,
        tenantId,
        emotionId
      }
    );

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'mood_entry',
      'saved',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        tenantId,
        emotionId,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
        duration: Date.now() - startTime
      }
    );

    return res.status(201).json({
      message: 'Mood entry saved successfully',
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
        upsertedId: result.upsertedId
      }
    });

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
      'MOOD_ENTRY_SAVE_FAILED',
      'Failed to save mood entry',
      { error, userId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'mood_entry',
      'save_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        userId,
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}