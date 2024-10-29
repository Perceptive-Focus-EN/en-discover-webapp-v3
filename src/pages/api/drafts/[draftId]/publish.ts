// src/pages/api/drafts/[draftId]/publish.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import type { DecodedToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { Draft, Post } from '@/feature/posts/api/types';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { ObjectId } from 'mongodb';
import { redisService } from '@/services/cache/redisService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { draftId } = req.query;
  let decodedToken: DecodedToken | null = null;

  try {
    if (req.method !== 'PUT') {
      res.setHeader('Allow', ['PUT']);
      throw monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        `Method ${req.method} not allowed`
      );
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'No token provided'
      );
    }

    decodedToken = verifyAccessToken(token) as DecodedToken;
    if (!decodedToken) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
    }

    const { db, client } = await getCosmosClient(undefined, true);

    if (!client) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_ERROR',
        'Database client not available'
      );
    }

    const draftsCollection = db.collection(COLLECTIONS.DRAFTS);
    const postsCollection = db.collection(COLLECTIONS.POSTS);

    // Try cache first
    const draftCacheKey = `draft:${draftId}:${decodedToken.userId}`;
    let draft: Draft | null = null;

    try {
      const cachedDraft = await redisService.getValue(draftCacheKey);
      if (cachedDraft) {
        const parsedDraft = JSON.parse(cachedDraft);
        if (parsedDraft.status === 'draft') {
          draft = parsedDraft;
          monitoringManager.metrics.recordMetric(
            MetricCategory.PERFORMANCE,
            'draft_cache',
            'hit',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            { draftId: draftId as string, userId: decodedToken.userId }
          );
        }
      }
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
    }

    // Fallback to database if not in cache
    if (!draft) {
      draft = await draftsCollection.findOne({
        draftId,
        userId: decodedToken.userId,
        status: 'draft'
      }) as Draft | null;
    }

    if (!draft) {
      throw monitoringManager.error.createError(
        'business',
        'DRAFT_NOT_FOUND',
        'Draft not found or already published'
      );
    }

    let newPost: Post | null = null;
    let publishError: any = null;

    try {
      newPost = {
        id: new ObjectId().toString(),
        userId: draft.userId,
        username: draft.username,
        userAvatar: draft.userAvatar,
        type: draft.type,
        content: draft.content,
        media: draft.media,
        reactions: [],
        commentCount: 0,
        authorId: draft.userId,
        timestamp: new Date().toISOString(),
        userAccountType: draft.userAccountType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'published',
        visibility: req.body.visibility || 'public',
        metadata: {
          ...draft.metadata,
          draftId: draft.draftId,
          publishedFrom: 'draft',
          publishedBy: decodedToken.userId
        }
      };

      const insertResult = await postsCollection.insertOne(newPost);
      
      if (!insertResult.acknowledged) {
        throw new Error('Failed to insert new post');
      }

      const updateResult = await draftsCollection.updateOne(
        { draftId },
        {
          $set: {
            status: 'published',
            postId: newPost.id,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedBy: decodedToken.userId
          }
        }
      );

      if (!updateResult.acknowledged) {
        publishError = new Error('Failed to update draft status');
        await postsCollection.deleteOne({ id: newPost.id });
        throw publishError;
      }

      // Invalidate cache after successful publish
      try {
        await redisService.deleteValue(draftCacheKey);
      } catch (cacheError) {
        console.error('Cache invalidation error:', cacheError);
      }

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'draft',
        'publish',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          userId: decodedToken.userId,
          draftId: draftId as string,
          postId: newPost.id,
          duration: Date.now() - startTime
        }
      );

      return res.status(200).json({
        data: newPost,
        message: 'Draft published successfully'
      });

    } catch (error) {
      if (newPost && !publishError) {
        try {
          await postsCollection.deleteOne({ id: newPost.id });
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
        }
      }
      throw error;
    }

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'DRAFT_PUBLISH_FAILED',
      'Failed to publish draft',
      { error, draftId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'draft',
      'publish_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken?.userId || 'unknown',
        draftId: draftId as string,
        errorType: appError.type,
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        type: 'DRAFT_PUBLISH_FAILED',
        reference: errorResponse.errorReference
      }
    });
  }
}