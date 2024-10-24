import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function fetchPostsHandler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

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

  const { page = '1', limit = '10', feedType = 'forYou', emotions = '' } = req.query;
  const pageNumber = parseInt(page as string, 10);
  const postsPerPage = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * postsPerPage;
  const activeEmotions = emotions ? (emotions as string).split(',').map(Number) : [];

  try {
    const client = await getCosmosClient();
    const db = client.db;

    let query: any = {};

    // Record query parameters metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'post',
      'query_params',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        feedType,
        pageNumber,
        postsPerPage,
        emotionsCount: activeEmotions.length
      }
    );

    if (feedType === 'following') {
      const userDoc = await db.collection(COLLECTIONS.POSTS).findOne({ _id: decodedToken.postId });
      if (!userDoc || !userDoc.following) {
        const appError = monitoringManager.error.createError(
          'business',
          'USER_NOT_FOUND',
          'User not found or no following list available',
          { userId: decodedToken.postId }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }
      query.postId = { $in: userDoc.following };
    } else if (feedType === 'forYou') {
      query.$or = [
        { postId: decodedToken.postId },
        { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ];

      const userDoc = await db.collection(COLLECTIONS.POSTS).findOne({ _id: decodedToken.postId });
      if (userDoc?.following) {
        query.$or.push({ userId: { $in: userDoc.following } });
      }
    }

    if (activeEmotions.length > 0) {
      query.$or = [
        { 'content.mood': { $in: activeEmotions } },
        { postType: 'MOOD', 'content.mood': { $in: activeEmotions } }
      ];
    }

    const queryStart = Date.now();
    const posts = await db.collection(COLLECTIONS.POSTS)
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: COLLECTIONS.REACTIONS,
            localField: '_id',
            foreignField: 'postId',
            as: 'reactions'
          }
        },
        {
          $addFields: {
            reactionCounts: {
              $map: {
                input: [1, 2, 3, 4, 5, 6, 7, 8],
                as: 'emotionId',
                in: {
                  emotionId: '$$emotionId',
                  count: {
                    $size: {
                      $filter: {
                        input: '$reactions',
                        cond: { $eq: ['$$this.emotionId', '$$emotionId'] }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        { $project: { reactions: 0 } },
        { $sort: { timestamp: -1 } },
        { $skip: skip },
        { $limit: postsPerPage }
      ]).toArray();

    // Record performance metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'post',
      'query_duration',
      Date.now() - queryStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        feedType,
        postsCount: posts.length
      }
    );

    // Record success metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'post',
      'fetched',
      posts.length,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        feedType,
        pageNumber,
        duration: Date.now() - startTime
      }
    );

    return res.status(200).json(posts);

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
      'POST_FETCH_FAILED',
      'Error fetching posts',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'post',
      'fetch_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        feedType,
        pageNumber
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

export default fetchPostsHandler;