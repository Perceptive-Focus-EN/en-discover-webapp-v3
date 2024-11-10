// src/pages/api/drafts/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { Draft, CreatePostDTO } from '@/feature/posts/api/types';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    // Auth validation
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

    switch (req.method) {
      case 'POST': {
        const draftData: CreatePostDTO = req.body;
        
        const newDraft: Draft = {
            draftId: new Date().getTime().toString(),
            userId: decodedToken.userId,
            tenantId: decodedToken.tenantId,
            type: draftData.type,
            content: draftData.content,
            media: draftData.media,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSavedAt: new Date().toISOString(),
            autoSaveVersion: 1,
            reactions: [],
            commentCount: 0,
            username: decodedToken.username,
            userAvatar: decodedToken.userAvatar,
            timestamp: new Date().toISOString(),
            accountType: decodedToken.accountType,
            visibility: 'private' // Drafts are always private
            ,
            authorId: decodedToken.userId
        };

        await draftsCollection.insertOne(newDraft);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'draft',
          'create',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            userId: decodedToken.userId,
            draftType: draftData.type
          }
        );

        return res.status(201).json({
          data: newDraft,
          message: 'Draft created successfully'
        });
      }

      case 'GET': {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const [drafts, totalCount] = await Promise.all([
          draftsCollection.find(
            { 
              userId: decodedToken.userId,
              status: 'draft'
            },
            {
              sort: { updatedAt: -1 },
              skip: (page - 1) * limit,
              limit
            }
          ).toArray(),
          draftsCollection.countDocuments({ 
            userId: decodedToken.userId,
            status: 'draft'
          })
        ]);

        monitoringManager.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          'draft',
          'list',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          {
            userId: decodedToken.userId,
            count: drafts.length
          }
        );

        return res.status(200).json({
          data: drafts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit,
            hasNextPage: page * limit < totalCount,
            hasPreviousPage: page > 1
          }
        });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
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
      { error }
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