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

    // Verify draft ownership
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

    switch (req.method) {
      case 'GET': {
        monitoringManager.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          'draft',
          'get',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          {
            userId: decodedToken.userId,
            draftId: draftId as string
          }
        );

        return res.status(200).json({
          data: draft
        });
      }

      case 'DELETE': {
        await draftsCollection.updateOne(
          { draftId },
          { 
            $set: { 
              status: 'archived',
              updatedAt: new Date().toISOString()
            } 
          }
        );

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'draft',
          'delete',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            userId: decodedToken.userId,
            draftId: draftId as string
          }
        );

        return res.status(200).json({
          message: 'Draft archived successfully'
        });
      }

      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        throw monitoringManager.error.createError(
          'business',
          'METHOD_NOT_ALLOWED',
          `Method ${req.method} not allowed`
        );
    }
  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'DRAFT_OPERATION_FAILED',
      'Failed to process draft operation',
      { error, draftId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.userMessage,
        type: 'DRAFT_OPERATION_FAILED',
        reference: errorResponse.errorReference
      }
    });
  }
}