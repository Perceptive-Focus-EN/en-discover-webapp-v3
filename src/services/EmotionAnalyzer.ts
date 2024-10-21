// src/services/EmotionAnalyzer.ts

import { getCosmosClient } from '../config/azureCosmosClient';
import { logger } from '../utils/ErrorHandling/logger';
import { redisService } from '../services/cache/redisService';
import { MoodEntry, EmotionFrequency, EmotionIntensity, EmotionTrigger, EmotionTrend } from '../components/EN/types/emotionAnalytics';
import { Collection } from 'mongodb';

class EmotionAnalyzer {
  private moodEntriesCollection: Collection | null = null;

  constructor() {
    this.initializeCollection();
  }

  private async initializeCollection() {
    try {
      const { db } = await getCosmosClient();
      this.moodEntriesCollection = db.collection('MoodEntries');
    } catch (error) {
      logger.error('Failed to initialize MoodEntries collection', error);
    }
  }

  private async ensureCollection() {
    if (!this.moodEntriesCollection) {
      await this.initializeCollection();
    }
  }

  async getRecentMoodEntries(userId: string, currentTenantId: string, limit: number = 10): Promise<MoodEntry[]> {
    await this.ensureCollection();
    const userId_currentTenantId = `${userId}_${currentTenantId}`;
    const cacheKey = `recent_mood_entries:${userId_currentTenantId}:${limit}`;
    
    try {
      const cachedEntries = await redisService.getValue(cacheKey);
      if (cachedEntries) {
        return JSON.parse(cachedEntries);
      }

      const entries = (await this.moodEntriesCollection!.find({ userId_currentTenantId })
        .sort({ date: -1 })
        .limit(limit)
        .toArray()).map(doc => ({
          id: doc._id.toString(),
          userId: doc.userId,
          tenantId: doc.tenantId,
          currentTenantId: doc.currentTenantId,
          emotionName: doc.emotionName,
          volume: doc.volume,
          date: doc.date,
          sources: doc.sources || []
        })) as MoodEntry[];

      await redisService.setValue(cacheKey, JSON.stringify(entries), 300); // Cache for 5 minutes

      return entries;
    } catch (error) {
      logger.error('Error getting recent mood entries', { userId, currentTenantId, error });
      throw error;
    }
  }

  async getRecentMoodEntriesFromHomeTenant(userId: string, limit: number = 10): Promise<MoodEntry[]> {
    await this.ensureCollection();
    const cacheKey = `recent_mood_entries_home:${userId}:${limit}`;
    
    try {
      const cachedEntries = await redisService.getValue(cacheKey);
      if (cachedEntries) {
        return JSON.parse(cachedEntries);
      }

      const entries = (await this.moodEntriesCollection!.find({ userId, tenantId: { $exists: true } })
        .sort({ date: -1 })
        .limit(limit)
        .toArray()).map(doc => ({
          id: doc._id.toString(),
          userId: doc.userId,
          tenantId: doc.tenantId,
          currentTenantId: doc.currentTenantId,
          emotionName: doc.emotionName,
          volume: doc.volume,
          date: doc.date,
          sources: doc.sources || []
        })) as MoodEntry[];

      await redisService.setValue(cacheKey, JSON.stringify(entries), 300); // Cache for 5 minutes

      return entries;
    } catch (error) {
      logger.error('Error getting recent mood entries from home tenant', { userId, error });
      throw error;
    }
  }

  async getAllUserMoodEntries(userId: string): Promise<MoodEntry[]> {
    await this.ensureCollection();
    const cacheKey = `all_mood_entries:${userId}`;
    
    try {
      const cachedEntries = await redisService.getValue(cacheKey);
      if (cachedEntries) {
        return JSON.parse(cachedEntries);
      }

      const entries = (await this.moodEntriesCollection!.find({ userId })
        .sort({ date: -1 })
        .toArray()).map(doc => ({
          id: doc._id.toString(),
          userId: doc.userId,
          tenantId: doc.tenantId,
          currentTenantId: doc.currentTenantId,
          emotionName: doc.emotionName,
          volume: doc.volume,
          date: doc.date,
          sources: doc.sources || []
        })) as MoodEntry[];

      await redisService.setValue(cacheKey, JSON.stringify(entries), 3600); // Cache for 1 hour

      return entries;
    } catch (error) {
      logger.error('Error getting all user mood entries', { userId, error });
      throw error;
    }
  }

  async getEmotionFrequency(userId: string, currentTenantId: string, startDate: string, endDate: string): Promise<EmotionFrequency[]> {
    await this.ensureCollection();
    const userId_currentTenantId = `${userId}_${currentTenantId}`;
    const cacheKey = `emotion_frequency:${userId_currentTenantId}:${startDate}:${endDate}`;

    try {
      const cachedFrequency = await redisService.getValue(cacheKey);
      if (cachedFrequency) {
        return JSON.parse(cachedFrequency);
      }

      const frequency = await this.moodEntriesCollection!.aggregate([
        {
          $match: {
            userId_currentTenantId,
            date: { $gte: new Date(startDate), $lt: new Date(endDate) }
          }
        },
        {
          $group: {
            _id: "$emotionName",
            frequency: { $sum: 1 }
          }
        },
        {
          $project: {
            emotionName: "$_id",
            frequency: 1,
            _id: 0
          }
        }
      ]).toArray() as EmotionFrequency[];

      await redisService.setValue(cacheKey, JSON.stringify(frequency), 3600); // Cache for 1 hour

      return frequency;
    } catch (error) {
      logger.error('Error getting emotion frequency', { userId, currentTenantId, error });
      throw error;
    }
  }

  async getAverageEmotionIntensity(userId: string, currentTenantId: string): Promise<EmotionIntensity[]> {
    await this.ensureCollection();
    const userId_currentTenantId = `${userId}_${currentTenantId}`;
    const cacheKey = `avg_emotion_intensity:${userId_currentTenantId}`;

    try {
      const cachedIntensity = await redisService.getValue(cacheKey);
      if (cachedIntensity) {
        return JSON.parse(cachedIntensity);
      }

      const intensity = await this.moodEntriesCollection!.aggregate([
        { $match: { userId_currentTenantId } },
        {
          $group: {
            _id: "$emotionName",
            avgIntensity: { $avg: "$volume" }
          }
        },
        {
          $project: {
            emotionName: "$_id",
            avgIntensity: 1,
            _id: 0
          }
        }
      ]).toArray() as EmotionIntensity[];

      await redisService.setValue(cacheKey, JSON.stringify(intensity), 3600); // Cache for 1 hour

      return intensity;
    } catch (error) {
      logger.error('Error getting average emotion intensity', { userId, currentTenantId, error });
      throw error;
    }
  }

  async getEmotionTriggers(userId: string, currentTenantId: string): Promise<EmotionTrigger[]> {
    await this.ensureCollection();
    const userId_currentTenantId = `${userId}_${currentTenantId}`;
    const cacheKey = `emotion_triggers:${userId_currentTenantId}`;

    try {
      const cachedTriggers = await redisService.getValue(cacheKey);
      if (cachedTriggers) {
        return JSON.parse(cachedTriggers);
      }

      const triggers = await this.moodEntriesCollection!.aggregate([
        { $match: { userId_currentTenantId } },
        {
          $group: {
            _id: { emotionName: "$emotionName", sources: "$sources" },
            frequency: { $sum: 1 }
          }
        },
        {
          $project: {
            emotionName: "$_id.emotionName",
            sources: "$_id.sources",
            frequency: 1,
            _id: 0
          }
        }
      ]).toArray() as EmotionTrigger[];

      await redisService.setValue(cacheKey, JSON.stringify(triggers), 3600); // Cache for 1 hour

      return triggers;
    } catch (error) {
      logger.error('Error getting emotion triggers', { userId, currentTenantId, error });
      throw error;
    }
  }

  async getEmotionTrends(userId: string, currentTenantId: string): Promise<EmotionTrend[]> {
    await this.ensureCollection();
    const userId_currentTenantId = `${userId}_${currentTenantId}`;
    const cacheKey = `emotion_trends:${userId_currentTenantId}`;

    try {
      const cachedTrends = await redisService.getValue(cacheKey);
      if (cachedTrends) {
        return JSON.parse(cachedTrends);
      }

      const trends = await this.moodEntriesCollection!.aggregate([
        { $match: { userId_currentTenantId } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              emotionName: "$emotionName"
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            date: "$_id.date",
            emotionName: "$_id.emotionName",
            count: 1,
            _id: 0
          }
        },
        { $sort: { date: 1 } }
      ]).toArray() as EmotionTrend[];

      await redisService.setValue(cacheKey, JSON.stringify(trends), 3600); // Cache for 1 hour

      return trends;
    } catch (error) {
      logger.error('Error getting emotion trends', { userId, currentTenantId, error });
      throw error;
    }
  }
}

export const emotionAnalyzer = new EmotionAnalyzer();