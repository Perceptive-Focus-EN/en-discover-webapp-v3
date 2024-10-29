// src/pages/api/posts/[postId]/reactions/counts.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { EmotionId, ReactionCount } from '@/feature/types/Reaction';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { postId } = req.query;

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
    if (!token || !verifyAccessToken(token)) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'Invalid or missing token'
      );
    }

    const { db } = await getCosmosClient();

    // Single aggregation pipeline for emotion counts
    const reactionCounts = await db.collection(COLLECTIONS.REACTIONS)
      .aggregate([
        { 
          $match: { 
            postId: new ObjectId(postId as string),
            deletedAt: { $exists: false } 
          } 
        },
        {
          $group: {
            _id: '$emotionId',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            emotionId: '$_id',
            count: 1
          }
        }
      ]).toArray() as ReactionCount[];

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'reaction_counts',
      'duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        postId: postId as string,
        totalCount: reactionCounts.reduce((sum, rc) => sum + rc.count, 0)
      }
    );

    return res.status(200).json({
      data: reactionCounts,
      success: true,
      message: 'Reaction counts retrieved successfully'
    });

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'REACTION_COUNTS_FAILED',
      'Failed to get reaction counts',
      { postId, error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        reference: errorResponse.errorReference
      },
      success: false
    });
  }
}


