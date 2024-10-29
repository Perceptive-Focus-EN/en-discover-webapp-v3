import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../../constants/collections';
import { EmotionId } from '../../../../../feature/types/Reaction';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, emotionId } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

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
  if (!decodedToken || decodedToken.userId !== userId) {
    const appError = monitoringManager.error.createError(
      'security',
      'AUTH_TOKEN_INVALID',
      'Invalid or expired token'
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  try {
    if (req.method !== 'PATCH') {
      const appError = monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        `Method ${req.method} Not Allowed`,
        { method: req.method }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      res.setHeader('Allow', ['PATCH']);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const { db } = await getCosmosClient();
    const collection = db.collection(COLLECTIONS.MOODBOARD);
    const { color } = req.body;

    const updateResult = await collection.updateOne(
      { userId: userId },
      {
        $set: {
          [`emotionMappings.${emotionId}`]: color,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'emotion_mapping',
        'update',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          userId,
          emotionId,
          success: true
        }
      );

      return res.status(200).json({ 
        message: 'Emotion mapping updated successfully' 
      });
    }

    throw monitoringManager.error.createError(
      'business',
      'UPDATE_FAILED',
      'Emotion mapping not found',
      { userId, emotionId }
    );

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
      'DATABASE_OPERATION_FAILED',
      'Error in emotion-mapping API',
      { error, userId, emotionId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'emotion_mapping',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'update',
        errorType: error.name || 'unknown',
        userId,
        emotionId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}