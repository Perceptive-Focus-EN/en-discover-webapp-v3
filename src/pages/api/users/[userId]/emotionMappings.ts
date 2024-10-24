import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../constants/collections';
import { Emotion } from '../../../../components/EN/types/emotions';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
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
    const { db } = await getCosmosClient();
    const collection = db.collection(COLLECTIONS.MOODBOARD);

    switch (req.method) {
      case 'GET': {
        const userMappings = await collection.findOne({ userId: userId });
        
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'emotion',
          'fetch',
          userMappings?.emotions?.length || 0,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { userId }
        );

        return res.status(200).json({
          success: true,
          message: "Request Was Successful",
          data: userMappings?.emotions || []
        });
      }

      case 'PUT': {
        const { emotions } = req.body as { emotions: Emotion[] };
        const now = new Date();
        const updatedEmotions = emotions.map(emotion => ({
          ...emotion,
          updatedAt: now,
          createdAt: emotion.createdAt || now,
          deletedAt: emotion.deletedAt || null
        }));

        const updateResult = await collection.updateOne(
          { userId: userId },
          {
            $set: {
              emotions: updatedEmotions,
              updatedAt: now
            },
            $setOnInsert: { createdAt: now }
          },
          { upsert: true }
        );

        if (updateResult.modifiedCount > 0 || updateResult.upsertedCount > 0) {
          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'emotion',
            'update_bulk',
            updatedEmotions.length,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            { userId }
          );

          return res.status(200).json({
            success: true,
            message: "Emotion mappings updated successfully",
            data: updatedEmotions
          });
        }

        throw monitoringManager.error.createError(
          'business',
          'UPDATE_FAILED',
          'Failed to update emotion mappings',
          { userId }
        );
      }

      case 'POST': {
        const { emotion } = req.body as { emotion: Omit<Emotion, 'id' | 'createdAt' | 'updatedAt'> };
        const newEmotion = {
          ...emotion,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const addResult = await collection.updateOne(
          { userId: userId },
          { $set: { [`emotions.${newEmotion.id}`]: newEmotion } }
        );

        if (addResult.modifiedCount > 0) {
          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'emotion',
            'create',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            { userId }
          );

          return res.status(201).json({
            success: true,
            message: "New emotion added successfully",
            data: newEmotion
          });
        }

        throw monitoringManager.error.createError(
          'business',
          'CREATE_FAILED',
          'Failed to add new emotion',
          { userId }
        );
      }

      case 'PATCH': {
        const { id, update } = req.body as { id: number, update: Partial<Emotion> };
        const updateOneResult = await collection.updateOne(
          { userId: userId },
          { $set: { [`emotions.${id}`]: { ...update, updatedAt: new Date().toISOString() } } }
        );

        if (updateOneResult.modifiedCount > 0) {
          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'emotion',
            'update_single',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            { userId, emotionId: id }
          );

          return res.status(200).json({
            success: true,
            message: "Emotion updated successfully",
          });
        }

        throw monitoringManager.error.createError(
          'business',
          'UPDATE_FAILED',
          'Failed to update emotion',
          { userId, emotionId: id }
        );
      }

      case 'DELETE': {
        const { emotionId } = req.body as { emotionId: number };
        const deleteResult = await collection.updateOne(
          { userId: userId },
          { $unset: { [`emotions.${emotionId}`]: "" } }
        );

        if (deleteResult.modifiedCount > 0) {
          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'emotion',
            'delete',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            { userId, emotionId }
          );

          return res.status(200).json({
            success: true,
            message: "Emotion deleted successfully",
          });
        }

        throw monitoringManager.error.createError(
          'business',
          'DELETE_FAILED',
          'Failed to delete emotion',
          { userId, emotionId }
        );
      }

      default: {
        const appError = monitoringManager.error.createError(
          'business',
          'METHOD_NOT_ALLOWED',
          `Method ${req.method} Not Allowed`,
          { method: req.method }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        res.setHeader('Allow', ['GET', 'PUT', 'POST', 'PATCH', 'DELETE']);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }
    }
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
      'Error in emotion-mappings API',
      { error, userId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'emotion',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: req.method?.toLowerCase() || 'unknown',
        errorType: error.name || 'unknown',
        userId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}