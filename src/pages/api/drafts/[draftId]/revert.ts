// src/pages/api/drafts/[draftId]/revert.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { Draft, Post } from '@/feature/posts/api/types';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { draftId } = req.query;

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

    const decodedToken = verifyAccessToken(token);
    const { db, client } = await getCosmosClient(undefined, true);
    
    if (!client) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_ERROR',
        'Database client not available'
      );
    }

    const draftsCollection = db.collection(COLLECTIONS.DRAFTS);
    const draftHistoryCollection = db.collection(COLLECTIONS.DRAFT_HISTORY);

    // Get current draft state
    const currentDraft = await draftsCollection.findOne({
      draftId,
      userId: decodedToken.userId
    });

    if (!currentDraft) {
      throw monitoringManager.error.createError(
        'business',
        'DRAFT_NOT_FOUND',
        'Draft not found or access denied'
      );
    }

    // Since Cosmos DB doesn't support multi-document transactions,
    // we'll handle operations sequentially with error rollback

    try {
      // Save current state to history
      await draftHistoryCollection.insertOne({
        draftId,
        version: currentDraft.autoSaveVersion,
        content: currentDraft.content,
        savedAt: currentDraft.updatedAt,
        restoredFrom: currentDraft.lastSavedAt
      });

      // Get last saved state
      const lastSavedState = await draftsCollection.findOne({
        draftId,
        updatedAt: currentDraft.lastSavedAt
      });

      if (!lastSavedState) {
        throw monitoringManager.error.createError(
          'business',
          'NO_SAVED_STATE',
          'No previous saved state found'
        );
      }

      // Revert to last saved state
      const revertedDraft = await draftsCollection.findOneAndUpdate(
        { draftId },
        {
          $set: {
            content: lastSavedState.content,
            media: lastSavedState.media,
            updatedAt: new Date().toISOString(),
            autoSaveVersion: lastSavedState.autoSaveVersion
          }
        },
        { returnDocument: 'after' }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'draft',
        'revert',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          userId: decodedToken.userId,
          draftId: draftId as string,
          fromVersion: currentDraft.autoSaveVersion,
          toVersion: lastSavedState.autoSaveVersion
        }
      );

      return res.status(200).json({
        data: revertedDraft,
        message: 'Draft reverted to last saved state successfully'
      });

    } catch (error) {
      // If any operation fails, attempt to clean up the history entry
      try {
        await draftHistoryCollection.deleteOne({
          draftId,
          version: currentDraft.autoSaveVersion
        });
      } catch (cleanupError) {
        // Log cleanup error but don't throw
        console.error('Cleanup failed:', cleanupError);
      }
      throw error;
    }

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'DRAFT_REVERT_FAILED',
      'Failed to revert draft',
      { error, draftId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        type: 'DRAFT_REVERT_FAILED',
        reference: errorResponse.errorReference
      }
    });
  }
}