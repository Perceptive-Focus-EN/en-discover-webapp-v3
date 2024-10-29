// src/pages/api/posts/[postId]/reactions/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { EmotionId, Reaction, ReactionResponse } from '@/feature/types/Reaction';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function handleGetReactions(
  postId: string,
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { db } = await getCosmosClient();
  
  const [reactions, totalCount] = await Promise.all([
    db.collection(COLLECTIONS.REACTIONS)
      .aggregate([
        {
          $match: {
            postId: new ObjectId(postId),
            deletedAt: { $exists: false }
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 1,
            emotionId: 1,
            emotionName: 1,
            createdAt: 1,
            'user.id': '$user._id',
            'user.name': {
              firstName: '$user.firstName',
              lastName: '$user.lastName'
            },
            'user.avatarUrl': 1
          }
        },
        { $skip: skip },
        { $limit: parseInt(limit as string) }
      ]).toArray(),
    db.collection(COLLECTIONS.REACTIONS).countDocuments({
      postId: new ObjectId(postId),
      deletedAt: { $exists: false }
    })
  ]);

  return res.status(200).json({
    data: reactions,
    pagination: {
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(totalCount / parseInt(limit as string)),
      totalItems: totalCount,
      itemsPerPage: parseInt(limit as string)
    }
  });
}

async function handleCreateReaction(
  postId: string,
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { emotionId } = req.body;

  if (!emotionId) {
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_ERROR',
      'EmotionId is required'
    );
  }

  const { db } = await getCosmosClient();
  
  // Check if user already reacted
  const existingReaction = await db.collection(COLLECTIONS.REACTIONS).findOne({
    postId: new ObjectId(postId),
    userId,
    deletedAt: { $exists: false }
  });

  if (existingReaction) {
    throw monitoringManager.error.createError(
      'business',
      'DUPLICATE_REACTION',
      'User already reacted to this post'
    );
  }

  // Get emotion details from moodboard collection
  const emotionDetails = await db.collection(COLLECTIONS.MOODBOARD).findOne(
    { 'emotions.id': emotionId },
    { projection: { 'emotions.$': 1 } }
  );

  if (!emotionDetails?.emotions?.[0]) {
    throw monitoringManager.error.createError(
      'business',
      'INVALID_EMOTION',
      'Invalid emotion ID'
    );
  }

  const { name: emotionName, color } = emotionDetails.emotions[0];

  const reaction = {
    _id: new ObjectId(),
    postId: new ObjectId(postId),
    userId,
    emotionId,
    emotionName,
    color,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection(COLLECTIONS.REACTIONS).insertOne(reaction);

  const populatedReaction = await db.collection(COLLECTIONS.REACTIONS)
    .aggregate([
      {
        $match: { _id: reaction._id }
      },
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          emotionId: 1,
          emotionName: 1,
          color: 1,
          createdAt: 1,
          'user.id': '$user._id',
          'user.name': {
            firstName: '$user.firstName',
            lastName: '$user.lastName'
          },
          'user.avatarUrl': 1
        }
      }
    ]).next();

  return res.status(201).json({
    data: populatedReaction,
    message: 'Reaction created successfully'
  });
}


async function handleToggleReaction(
  postId: string,
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { emotionId } = req.body;

  if (!emotionId) {
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_ERROR',
      'EmotionId is required'
    );
  }

  const { db } = await getCosmosClient();
  
  // Find existing reaction
  const existingReaction = await db.collection(COLLECTIONS.REACTIONS).findOne({
    postId: new ObjectId(postId),
    userId,
    deletedAt: { $exists: false }
  });

  if (existingReaction) {
    // If same emotion, remove it
    if (existingReaction.emotionId === emotionId) {
      await db.collection(COLLECTIONS.REACTIONS).updateOne(
        { _id: existingReaction._id },
        { 
          $set: { 
            deletedAt: new Date(),
            updatedAt: new Date()
          } 
        }
      );
      return res.status(200).json({
        message: 'Reaction removed successfully'
      });
    }
    // If different emotion, update it
    else {
      const updatedReaction = await db.collection(COLLECTIONS.REACTIONS).findOneAndUpdate(
        { _id: existingReaction._id },
        { 
          $set: {
            emotionId,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      return res.status(200).json({
        data: updatedReaction?.value,
        message: 'Reaction updated successfully'
      });
    }
  }

  // Create new reaction
  return handleCreateReaction(postId, userId, req, res);
}

async function handleApiError(
  error: any,
  req: NextApiRequest,
  res: NextApiResponse,
  startTime: number
) {
  const appError = AppError.isAppError(error)
    ? error
    : monitoringManager.error.createError(
        'system',
        'REACTION_OPERATION_FAILED',
        'Failed to process reaction operation',
        { error }
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
      errorType: appError.type,
      duration: Date.now() - startTime
    }
  );

  return res.status(errorResponse.statusCode).json({
    error: {
      message: errorResponse.userMessage,
      type: appError.type,
      reference: errorResponse.errorReference
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { postId } = req.query;
  
  try {
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

    switch (req.method) {
      case 'GET':
        return handleGetReactions(postId as string, req, res, decodedToken.userId);
      case 'POST':
        return handleCreateReaction(postId as string, decodedToken.userId, req, res);
      case 'PUT':
        return handleToggleReaction(postId as string, decodedToken.userId, req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        throw monitoringManager.error.createError(
          'business',
          'METHOD_NOT_ALLOWED',
          `Method ${req.method} not allowed`
        );
    }
  } catch (error) {
    return handleApiError(error, req, res, startTime);
  }
}