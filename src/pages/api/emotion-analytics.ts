import { NextApiRequest, NextApiResponse } from 'next';
import { emotionAnalyzer } from '../../services/EmotionAnalyzer';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    if (req.method !== 'GET') {
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

    const { userId, currentTenantId } = req.query;

    if (!userId || !currentTenantId) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Missing userId or currentTenantId',
        { userId, currentTenantId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Record analysis attempt
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'emotion',
      'analysis_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        tenantId: currentTenantId
      }
    );

    const startDate = "2023-05-01";
    const endDate = "2023-06-01";

    // Track each analysis operation
    const analysisStart = Date.now();
    const recentEntries = await emotionAnalyzer.getRecentMoodEntries(userId as string, currentTenantId as string);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'emotion',
      'recent_entries_duration',
      Date.now() - analysisStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId, tenantId: currentTenantId }
    );

    const frequencyStart = Date.now();
    const emotionFrequency = await emotionAnalyzer.getEmotionFrequency(
      userId as string,
      currentTenantId as string,
      startDate,
      endDate
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'emotion',
      'frequency_analysis_duration',
      Date.now() - frequencyStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId, tenantId: currentTenantId }
    );

    const intensityStart = Date.now();
    const avgIntensity = await emotionAnalyzer.getAverageEmotionIntensity(
      userId as string,
      currentTenantId as string
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'emotion',
      'intensity_analysis_duration',
      Date.now() - intensityStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId, tenantId: currentTenantId }
    );

    const triggersStart = Date.now();
    const emotionTriggers = await emotionAnalyzer.getEmotionTriggers(
      userId as string,
      currentTenantId as string
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'emotion',
      'triggers_analysis_duration',
      Date.now() - triggersStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId, tenantId: currentTenantId }
    );

    const trendsStart = Date.now();
    const emotionTrends = await emotionAnalyzer.getEmotionTrends(
      userId as string,
      currentTenantId as string
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'emotion',
      'trends_analysis_duration',
      Date.now() - trendsStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId, tenantId: currentTenantId }
    );

    // Record success metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'emotion',
      'analysis_complete',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        tenantId: currentTenantId,
        entriesCount: recentEntries.length,
        uniqueEmotions: Object.keys(emotionFrequency).length
      }
    );

    return res.status(200).json({
      recentEntries,
      emotionFrequency,
      avgIntensity,
      emotionTriggers,
      emotionTrends
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
      'EMOTION_ANALYSIS_FAILED',
      'Error analyzing emotions',
      { error, userId: req.query.userId, tenantId: req.query.currentTenantId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'emotion',
      'analysis_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        userId: req.query.userId,
        tenantId: req.query.currentTenantId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });

  } finally {
    // Record total operation duration
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'emotion',
      'total_analysis_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        userId: req.query.userId,
        tenantId: req.query.currentTenantId,
        status: res.statusCode.toString()
      }
    );
  }
}