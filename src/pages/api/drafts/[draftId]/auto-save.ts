// src/pages/api/drafts/[draftId]/auto-save.ts
// src/pages/api/drafts/[draftId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { Draft } from '@/feature/posts/api/types';
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
    const { db } = await getCosmosClient();
    const draftsCollection = db.collection(COLLECTIONS.DRAFTS);

    const draft = await draftsCollection.findOne({
      draftId,
      userId: decodedToken.userId
    });

    if (!draft) {
      throw monitoringManager.error.createError(
        'business',
        'DRAFT_NOT_FOUND',
        'Draft not found or access denied'
      );
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
      autoSaveVersion: (draft.autoSaveVersion || 0) + 1
    };

    const updatedDraft = await draftsCollection.findOneAndUpdate(
      { draftId },
      { 
        $set: updateData,
        $setOnInsert: {
          lastSavedAt: draft.lastSavedAt // Preserve last manual save
        }
      },
      { returnDocument: 'after' }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'draft',
      'auto_save',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        draftId: draftId as string,
        version: updateData.autoSaveVersion
      }
    );

    return res.status(200).json({
      data: updatedDraft,
      message: 'Draft auto-saved successfully'
    });
  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'DRAFT_AUTO_SAVE_FAILED',
      'Failed to auto-save draft',
      { error, draftId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        type: 'DRAFT_AUTO_SAVE_FAILED',
        reference: errorResponse.errorReference
      }
    });
  }
}