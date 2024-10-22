// src/pages/api/posts/[postId]/reactions.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { Reaction, EmotionId } from '../../../../components/Feed/types/Reaction';
import { ERROR_MESSAGES } from '../../../../constants/errorMessages';
import { ApiError, UnauthorizedError } from '../../../../errors/errors';
import { ObjectId } from 'mongodb';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
  }

  try {
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_SESSION);
    }

    const client = await getCosmosClient();
    const db = client.db;
    const reactionsCollection = db.collection(COLLECTIONS.REACTIONS);
    const moodboardCollection = db.collection(COLLECTIONS.MOODBOARD);

    switch (req.method) {
      case 'GET':
        return await getPostReactions(postId as string, reactionsCollection, moodboardCollection, res);
      case 'POST':
        return await updatePostReaction(postId as string, decodedToken.userId, req.body.emotionId, reactionsCollection, moodboardCollection, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        throw new ApiError(405, ERROR_MESSAGES.METHOD_NOT_ALLOWED);
    }
  } catch (error) {
    logger.error(new Error('Error in reactions API'), { error });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: ERROR_MESSAGES.INVALID_REQUEST });
  }
}

async function getPostReactions(postId: string, reactionsCollection: any, moodboardCollection: any, res: NextApiResponse) {
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

  res.status(200).json(reactions);
}

async function updatePostReaction(postId: string, userId: string, emotionId: EmotionId, reactionsCollection: any, moodboardCollection: any, res: NextApiResponse) {
  const existingReaction = await reactionsCollection.findOne({ postId: new ObjectId(postId), userId });

  if (existingReaction) {
    if (existingReaction.emotionId === emotionId) {
      // If the same emotion, remove the reaction
      await reactionsCollection.deleteOne({ _id: existingReaction._id });
    } else {
      // If different emotion, update the reaction
      await reactionsCollection.updateOne(
        { _id: existingReaction._id },
        { $set: { emotionId, updatedAt: new Date() } }
      );
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
  }

  // Re-fetch the updated reactions
  await getPostReactions(postId, reactionsCollection, moodboardCollection, res);
}