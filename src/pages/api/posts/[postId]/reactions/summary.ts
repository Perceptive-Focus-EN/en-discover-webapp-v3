// src/pages/api/posts/[postId]/reactions/summary.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { EmotionName, ReactionSummary } from '@/feature/types/Reaction';
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

    // Auth validation
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

    const { db } = await getCosmosClient();
    const reactionsCollection = db.collection(COLLECTIONS.REACTIONS);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Aggregate reactions
    const aggregationPipeline = [
      { $match: { postId: new ObjectId(postId as string) } },
      {
        $group: {
          _id: '$emotionName',
          count: { $sum: 1 },
          recentUserIds: { $topN: { n: 3, sortBy: { createdAt: -1 }, output: '$userId' } }
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'recentUserIds',
          foreignField: '_id',
          as: 'recentUsers'
        }
      }
    ];

    const reactionGroups = await reactionsCollection.aggregate(aggregationPipeline).toArray();

    // Check if user has reacted
    const userReactions = await reactionsCollection.find({
      postId: new ObjectId(postId as string),
      userId: decodedToken.userId
    }).toArray();

    interface RecentUser {
        id: string;
        name: string;
        avatar: string;
    }

    interface ReactionGroup {
        _id: EmotionName;
        count: number;
        recentUsers: {
            _id: ObjectId;
            firstName: string;
            lastName: string;
            avatarUrl: string;
        }[];
    }

    const summary: ReactionSummary[] = reactionGroups.map((group: ReactionGroup) => ({
        type: group._id as EmotionName,
        count: group.count,
        hasReacted: userReactions.some(r => r.emotionName === group._id),
        recentUsers: group.recentUsers.map((user): RecentUser => ({
            id: user._id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            avatar: user.avatarUrl
        }))
    }));

    // Record metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'reaction_summary',
      'duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        postId: postId as string,
        reactionCount: summary.reduce((acc, s) => acc + s.count, 0)
      }
    );

    return res.status(200).json({
      data: summary,
      status: 200
    });

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'REACTION_SUMMARY_FAILED',
      'Failed to get reaction summary',
      { postId, error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'reaction_summary',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        postId: postId as string,
        errorType: error instanceof Error ? error.name : 'unknown',
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        type: 'REACTION_SUMMARY_FAILED',
        reference: errorResponse.errorReference
      },
      status: errorResponse.statusCode
    });
  }
}