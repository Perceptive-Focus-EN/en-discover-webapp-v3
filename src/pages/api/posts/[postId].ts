import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function getPostHandler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  // Validate HTTP method
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

  const { postId } = req.query;

  // Validate post ID
  if (!postId || typeof postId !== 'string') {
    const appError = monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Invalid post ID',
      { postId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  try {
    const client = await getCosmosClient();
    const db = client.db;

    const queryStart = Date.now();
    const post = await db.collection(COLLECTIONS.POSTS).aggregate([
      { $match: { _id: new ObjectId(postId) } },
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
      { $project: { reactions: 0 } }
    ]).next();

    // Record query performance metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'post',
      'query_duration',
      Date.now() - queryStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        postId,
        hasResult: !!post
      }
    );

    // Check if post exists
    if (!post) {
      const appError = monitoringManager.error.createError(
        'business',
        'POST_NOT_FOUND',
        'Post not found',
        { postId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Record successful fetch metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'post',
      'fetched',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        postId,
        reactionCount: post.reactionCounts?.length || 0,
        duration: Date.now() - startTime
      }
    );

    // Return the post data
    return res.status(200).json(post);

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Handle unexpected errors
    const appError = monitoringManager.error.createError(
      'system',
      'POST_FETCH_FAILED',
      'Error fetching post',
      { error, postId }
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
        postId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

export default getPostHandler;
