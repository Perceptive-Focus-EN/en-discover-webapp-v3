import type { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyAccessToken, isTokenBlacklisted } from '../../../utils/TokenManagement/serverTokenUtils';
import { MoodHistoryItem, MoodHistoryQuery, TimeRange } from '../../../components/EN/types/moodHistory';
import { getStartDate } from '../../../utils/dateUtil';
import { Emotion } from '@/components/EN/types/emotions';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

function isValidTimeRange(timeRange: string): timeRange is TimeRange {
  return ['day', 'week', 'month', 'year', 'lifetime'].includes(timeRange);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    const appError = monitoringManager.error.createError(
      'business',
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      { method: req.method }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    res.setHeader('Allow', ['GET']);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

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

  try {
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
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

    const { emotion, timeRange } = req.query;

    if (!emotion || !timeRange || Array.isArray(emotion) || Array.isArray(timeRange)) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Invalid emotion or time range',
        { emotion, timeRange }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    if (!isValidTimeRange(timeRange)) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Invalid time range',
        { timeRange }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const moodHistoryQuery: MoodHistoryQuery = {
      emotion: emotion as unknown as Emotion,
      timeRange: timeRange as TimeRange,
      startDate: '',
      endDate: ''
    };

    const { db } = await getCosmosClient();
    const collection = db.collection(COLLECTIONS.MOODBOARD);
    const startDate = getStartDate(moodHistoryQuery.timeRange);

    const queryStart = Date.now();
    const moodHistory = await collection.find<MoodHistoryItem>({
      userId: decodedToken.userId,
      emotionName: moodHistoryQuery.emotion,
      date: { $gte: startDate }
    }).sort({ date: 1 }).toArray();

    // Record query performance
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'mood_history',
      'query_duration',
      Date.now() - queryStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        userId: decodedToken.userId,
        timeRange,
        emotion,
        resultCount: moodHistory.length
      }
    );

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'mood_history',
      'fetched',
      moodHistory.length,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        timeRange,
        emotion,
        duration: Date.now() - startTime
      }
    );

    return res.status(200).json(moodHistory);

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
      'MOOD_HISTORY_FETCH_FAILED',
      'Error fetching mood history',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'mood_history',
      'fetch_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}