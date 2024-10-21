// src/services/emotionService.ts

import { getCosmosClient } from '../../../config/azureCosmosClient';
import { EmotionId, SourceCategoryId } from '../constants/emotionsAndCategories';
import { ObjectId } from 'mongodb';

interface UserEmotion {
  userId: string;
  emotionId: EmotionId;
  sourceCategoryId: SourceCategoryId;
  sourceId?: number;  // Optional, for user-defined sources
  volume: number;
  timestamp: Date;
}

export async function recordUserEmotion(userEmotion: UserEmotion) {
  const { db } = await getCosmosClient();
  const collection = db.collection('userEmotions');
  
  const result = await collection.insertOne({
    ...userEmotion,
    _id: new ObjectId(),
    timestamp: new Date()
  });

  return result.insertedId;
}

export async function getUserEmotions(userId: string, startDate: Date, endDate: Date) {
  const { db } = await getCosmosClient();
  const collection = db.collection('userEmotions');

  const emotions = await collection.find({
    userId,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 }).toArray();

  return emotions;
}

export async function addUserDefinedSource(userId: string, name: string, categoryId: SourceCategoryId) {
  const { db } = await getCosmosClient();
  const collection = db.collection('userSources');

  const result = await collection.insertOne({
    userId,
    name,
    categoryId,
    _id: new ObjectId()
  });

  return result.insertedId;
}

export async function getUserDefinedSources(userId: string) {
  const { db } = await getCosmosClient();
  const collection = db.collection('userSources');

  const sources = await collection.find({ userId }).toArray();
  return sources;
}