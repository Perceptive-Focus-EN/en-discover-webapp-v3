// src/pages/api/posts/reactions/batch.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ReactionMetrics, ReactionSummary } from '@/feature/types/Reaction';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
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

    const { postIds, includeMetrics = false } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_ERROR',
        'Invalid or empty post IDs array'
      );
    }

    const { db } = await getCosmosClient();
    const objectIds = postIds.map(id => new ObjectId(id));

    const pipeline = [
      {
        $match: {
          postId: { $in: objectIds },
          deletedAt: { $exists: false }
        }
      },
      {
        $group: {
          _id: {
            postId: '$postId',
            emotionName: '$emotionName'
          },
          count: { $sum: 1 },
          recentUsers: { 
            $topN: { 
              n: 3,
              sortBy: { createdAt: -1 },
              output: {
                id: '$userId',
                name: '$userName',
                avatar: '$userAvatar'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.postId',
          reactions: {
            $push: {
              type: '$_id.emotionName',
              count: '$count',
              recentUsers: '$recentUsers'
            }
          }
        }
      },
      ...(includeMetrics ? [{
        $lookup: {
          from: COLLECTIONS.REACTIONS,
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$postId', '$$postId'] }
              }
              },
            // Add metrics aggregation here similar to metrics endpoint
          ],
          as: 'metrics'
        }
      }] : [])
    ];

    const results = await db.collection(COLLECTIONS.REACTIONS)
      .aggregate(pipeline)
      .toArray();

    const response = results.reduce((acc, result) => {
      acc[result._id.toString()] = {
        summary: result.reactions,
        ...(includeMetrics && { metrics: result.metrics[0] })
      };
      return acc;
    }, {});

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'batch_reactions',
      'duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        postCount: postIds.length,
        includeMetrics
      }
    );

    return res.status(200).json({ data: response });

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'BATCH_REACTIONS_FAILED',
      'Failed to get batch reactions',
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
