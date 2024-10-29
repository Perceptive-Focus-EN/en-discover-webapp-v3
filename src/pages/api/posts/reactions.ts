import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { Reaction, EmotionId } from '../../../../feature/types/Reaction';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

interface AggregatedReaction {
  _id: EmotionId;
  count: number;
}

interface EmotionMapping {
  id: EmotionId;
  emotionName: string;
  color: string;
}

interface EmotionMappings {
  emotions: EmotionMapping[];
}

async function getPostReactions(postId: string, reactionsCollection: any, moodboardCollection: any, res: NextApiResponse) {
  const queryStart = Date.now();

  const aggregatedReactions = await reactionsCollection.aggregate([
    { $match: { postId: new ObjectId(postId) } },
    { $group: { _id: '$emotionId', count: { $sum: 1 } } }
  ]).toArray();

  const emotionMappings: EmotionMappings = await moodboardCollection.findOne({}, { projection: { emotions: 1 } });

  const reactions: Reaction[] = aggregatedReactions.map((reaction: { _id: EmotionId, count: number }) => {
    const emotion = emotionMappings.emotions.find(e => e.id === reaction._id);
    return {
      id: reaction._id.toString(),
      emotionId: reaction._id,
      count: reaction.count,
      name: emotion?.emotionName || 'Unknown',
      color: emotion?.color || 'Unknown'
    };
  });

  // Record performance metric
  monitoringManager.metrics.recordMetric(
    MetricCategory.PERFORMANCE,
    'reaction',
    'query_duration',
    Date.now() - queryStart,
    MetricType.HISTOGRAM,
    MetricUnit.MILLISECONDS,
    {
      postId,
      reactionCount: reactions.length
    }
  );

  return res.status(200).json(reactions);
}

async function updatePostReaction(
  postId: string,
  userId: string,
  emotionId: EmotionId,
  reactionsCollection: any,
  moodboardCollection: any,
  res: NextApiResponse
) {
  const operationStart = Date.now();
  const existingReaction = await reactionsCollection.findOne({ postId: new ObjectId(postId), userId });

  let operationType: 'add' | 'update' | 'remove';

  try {
    if (existingReaction) {
      if (existingReaction.emotionId === emotionId) {
        // Remove reaction
        await reactionsCollection.deleteOne({ _id: existingReaction._id });
        operationType = 'remove';
      } else {
        // Update reaction
        await reactionsCollection.updateOne(
          { _id: existingReaction._id },
          { $set: { emotionId, updatedAt: new Date() } }
        );
        operationType = 'update';
      }
    } else {
      // Add new reaction
      await reactionsCollection.insertOne({
        postId: new ObjectId(postId),
        userId,
        emotionId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      operationType = 'add';
    }

    // Record operation metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'reaction',
      operationType,
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        postId,
        userId,
        emotionId,
        duration: Date.now() - operationStart
      }
    );

    // Re-fetch updated reactions
    return await getPostReactions(postId, reactionsCollection, moodboardCollection, res);
  } catch (error) {
    throw monitoringManager.error.createError(
      'system',
      'REACTION_UPDATE_FAILED',
      'Failed to update reaction',
      { error, postId, userId, emotionId }
    );
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { postId } = req.query;
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

  try {
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
    }

    const client = await getCosmosClient();
    const db = client.db;
    const reactionsCollection = db.collection(COLLECTIONS.REACTIONS);
    const moodboardCollection = db.collection(COLLECTIONS.MOODBOARD);

    switch (req.method) {
      case 'GET':
        return await getPostReactions(postId as string, reactionsCollection, moodboardCollection, res);
      case 'POST':
        return await updatePostReaction(
          postId as string,
          decodedToken.userId,
          req.body.emotionId,
          reactionsCollection,
          moodboardCollection,
          res
        );
      default:
        const appError = monitoringManager.error.createError(
          'business',
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          { method: req.method }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
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
      'REACTION_OPERATION_FAILED',
      'Error in reactions API',
      { error, postId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'reaction',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: req.method?.toLowerCase() || 'unknown',
        errorType: error instanceof Error ? error.name : 'unknown',
        postId,
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}