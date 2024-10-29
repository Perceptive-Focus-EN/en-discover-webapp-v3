// src/pages/api/posts/[postId]/reactions/trends.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { EmotionName } from '@/feature/types/Reaction';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

const getTimeFrameParams = (timeframe: string) => {
  const now = new Date();
  switch (timeframe) {
    case 'hour':
      return {
        interval: 5 * 60 * 1000, // 5 minutes
        startTime: new Date(now.getTime() - 60 * 60 * 1000)
      };
    case 'day':
      return {
        interval: 60 * 60 * 1000, // 1 hour
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      };
    case 'week':
      return {
        interval: 24 * 60 * 60 * 1000, // 1 day
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      };
    case 'month':
      return {
        interval: 24 * 60 * 60 * 1000, // 1 day
        startTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      };
    default:
      return {
        interval: 60 * 60 * 1000,
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      };
  }
};

type TrendDataPoint = {
  _id: number;
  emotions: { name: EmotionName; count: number }[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { postId } = req.query;
  const timeframe = (req.query.timeframe as string) || 'day';

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

    const { interval, startTime: periodStart } = getTimeFrameParams(timeframe);
    const { db } = await getCosmosClient();

    const trendData = await db.collection(COLLECTIONS.REACTIONS)
      .aggregate([
        {
          $match: {
            postId: new ObjectId(postId as string),
            createdAt: { $gte: periodStart },
            deletedAt: { $exists: false }
          }
        },
        {
          $group: {
            _id: {
              emotionName: '$emotionName',
              interval: {
                $subtract: [
                  { $toLong: '$createdAt' },
                  { $mod: [{ $toLong: '$createdAt' }, interval] }
                ]
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.interval',
            emotions: {
              $push: {
                name: '$_id.emotionName',
                count: '$count'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

    // Transform data into the required format
    const timestamps: string[] = [];
    const emotionCounts: Record<EmotionName, number[]> = {
      EUPHORIC: [],
      TRANQUIL: [],
      REACTIVE: [],
      SORROW: [],
      FEAR: [],
      DISGUST: [],
      SUSPENSE: [],
      ENERGY: []
    };

    trendData.forEach((point: TrendDataPoint) => {
        timestamps.push(new Date(point._id).toISOString());
        point.emotions.forEach((emotion: { name: EmotionName; count: number }) => {
            if (!emotionCounts[emotion.name]) {
                emotionCounts[emotion.name] = Array(timestamps.length - 1).fill(0);
            }
            emotionCounts[emotion.name].push(emotion.count);
        });
    });

    // Fill in missing values
    Object.values(emotionCounts).forEach(counts => {
      while (counts.length < timestamps.length) {
        counts.push(0);
      }
    });

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'reaction_trends',
      'duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        postId: postId as string,
        timeframe,
        dataPoints: timestamps.length
      }
    );

    return res.status(200).json({
      data: {
        timestamps,
        data: emotionCounts
      }
    });

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'REACTION_TRENDS_FAILED',
      'Failed to get reaction trends',
      { postId, timeframe, error }
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