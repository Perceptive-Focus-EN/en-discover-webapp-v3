// src/pages/api/posts/[postId]/reactions/metrics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { EmotionName, ReactionMetrics } from '@/feature/types/Reaction';
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
    
    const [metrics] = await db.collection(COLLECTIONS.REACTIONS).aggregate([
      {
        $match: {
          postId: new ObjectId(postId as string),
          deletedAt: { $exists: false }
        }
      },
      {
        $facet: {
          totalReactions: [
            { $count: 'count' }
          ],
          distribution: [
            {
              $group: {
                _id: '$emotionName',
                count: { $sum: 1 }
              }
            }
          ],
          timeMetrics: [
            {
              $group: {
                _id: null,
                peakTime: { $max: '$createdAt' },
                firstReaction: { $min: '$createdAt' }
              }
            }
          ]
        }
      },
      {
        $project: {
          totalReactions: { $arrayElemAt: ['$totalReactions.count', 0] },
          reactionDistribution: {
            $arrayToObject: {
              $map: {
                input: '$distribution',
                as: 'dist',
                in: { k: '$$dist._id', v: '$$dist.count' }
              }
            }
          },
          peakReactionTime: { $arrayElemAt: ['$timeMetrics.peakTime', 0] },
          reactionVelocity: {
            $cond: [
              { $gt: [{ $arrayElemAt: ['$timeMetrics.peakTime', 0] }, null] },
              {
                $divide: [
                  { $arrayElemAt: ['$totalReactions.count', 0] },
                  {
                    $divide: [
                      {
                        $subtract: [
                          { $arrayElemAt: ['$timeMetrics.peakTime', 0] },
                          { $arrayElemAt: ['$timeMetrics.firstReaction', 0] }
                        ]
                      },
                      3600000 // Convert to hours
                    ]
                  }
                ]
              },
              0
            ]
          }
        }
      }
    ]).toArray();

    const reactionMetrics: ReactionMetrics = {
      totalReactions: metrics.totalReactions || 0,
      averageEngagementRate: metrics.totalReactions ? metrics.reactionVelocity : 0,
      peakReactionTime: metrics.peakReactionTime,
      reactionDistribution: metrics.reactionDistribution as Record<EmotionName, number>,
      reactionVelocity: metrics.reactionVelocity
    };

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'reaction_metrics',
      'duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        postId: postId as string,
        totalReactions: reactionMetrics.totalReactions
      }
    );

    return res.status(200).json({ data: reactionMetrics });

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'REACTION_METRICS_FAILED',
      'Failed to get reaction metrics',
      { postId, error }
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