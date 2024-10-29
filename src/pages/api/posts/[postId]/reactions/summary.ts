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

    // Aggregation pipeline
    const aggregationPipeline = [
      { $match: { postId: new ObjectId(postId as string) } },
      {
        $group: {
          _id: '$emotionName',
          count: { $sum: 1 },
          recentUsers: { $push: { userId: '$userId', createdAt: '$createdAt' } }
        }
      },
      { $sort: { count: -1 } },
      { $project: {
          _id: 1,
          count: 1,
          recentUsers: { $slice: ['$recentUsers', 5] } // Limit recent users to top 5
        }
      }
    ];

    const reactionGroups = await reactionsCollection.aggregate(aggregationPipeline).toArray();

    // Fetch recent user details
    const recentUserIds = reactionGroups.flatMap(group => group.recentUsers.map((user: { userId: any; }) => user.userId));
    const userDocs = await usersCollection.find({ _id: { $in: recentUserIds.map(id => new ObjectId(id)) } }).toArray();

    // Map user details to reaction groups
    const summary: ReactionSummary[] = reactionGroups.map(group => {
      const recentUsers = group.recentUsers
        .map((user: { userId: string; }) => userDocs.find(doc => doc._id.toString() === user.userId))
        .filter(Boolean)
        .map((user: { _id: { toString: () => any; }; firstName: any; lastName: any; avatarUrl: any; }) => ({
          id: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatarUrl
        }));

      return {
        type: group._id as EmotionName,
        count: group.count,
        color: '', // Default, updated later
        hasReacted: false, // Default, updated later
        recentUsers
      };
    });

    // Check if the user has reacted
    const userReactions = await reactionsCollection.find({
      postId: new ObjectId(postId as string),
      userId: decodedToken.userId
    }).toArray();

    summary.forEach((reaction) => {
      reaction.hasReacted = userReactions.some(r => r.emotionName === reaction.type);
    });

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
