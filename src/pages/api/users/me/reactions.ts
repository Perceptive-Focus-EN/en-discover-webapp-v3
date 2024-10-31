// src/pages/api/users/me/reactions.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { PostReaction } from '@/feature/types/Reaction';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      throw monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        `Method ${req.method} not allowed`
      );
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'No token provided'
      );
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
    }

    const { 
      page = 1, 
      limit = 20, 
      emotionId, 
      startDate, 
      endDate 
    } = req.query;

    const { db } = await getCosmosClient();

    const query: any = {
      userId: decodedToken.userId,
      deletedAt: { $exists: false }
    };

    if (emotionId) {
      query.emotionId = parseInt(emotionId as string);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const [reactions, totalCount] = await Promise.all([
      db.collection(COLLECTIONS.REACTIONS)
        .find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .limit(parseInt(limit as string))
        .toArray(),
      db.collection(COLLECTIONS.REACTIONS).countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit as string));

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'user_reactions',
      'duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        userId: decodedToken.userId,
        page: parseInt(page as string),
        totalItems: totalCount
      }
    );

    return res.status(200).json({
      data: reactions,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit as string),
        hasNextPage: parseInt(page as string) < totalPages,
        hasPreviousPage: parseInt(page as string) > 1
      }
    });

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'USER_REACTIONS_FAILED',
      'Failed to get user reactions',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        reference: errorResponse.errorReference
      }
    });
  }
}