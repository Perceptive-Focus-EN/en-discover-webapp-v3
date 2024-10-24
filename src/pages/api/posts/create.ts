import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { User } from '../../../types/User/interfaces';
import { ObjectId } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function createPostHandler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    const appError = monitoringManager.error.createError(
      'business',
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      { method: req.method }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  const { user, type, content, ...otherData } = req.body;

  if (!user || !user.userId) {
    const appError = monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Missing user information'
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  try {
    const client = await getCosmosClient();
    const db = client.db;

    if (!type || !content) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Missing required fields',
        { missingFields: !type ? 'type' : 'content' }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const postsCollection = db.collection(COLLECTIONS.POSTS);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const userData = await usersCollection.findOne({ userId: user.userId }) as User | null;
    if (!userData) {
      const appError = monitoringManager.error.createError(
        'business',
        'USER_NOT_FOUND',
        'User not found',
        { userId: user.userId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    if (!userData.currentTenantId) {
      const appError = monitoringManager.error.createError(
        'business',
        'TENANT_NOT_FOUND',
        'User does not have a current tenant',
        { userId: user.userId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const newPost = {
      userId: userData.userId,
      tenantId: userData.currentTenantId,
      username: `${userData.firstName} ${userData.lastName}`,
      userAvatar: userData.avatarUrl || '',
      type,
      content,
      timestamp: new Date().toISOString(),
      ...otherData
    };

    const result = await postsCollection.insertOne(newPost);

    if (!result.insertedId) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_OPERATION_FAILED',
        'Failed to insert post'
      );
    }

    const insertedPost = {
      ...newPost,
      _id: result.insertedId,
      id: result.insertedId.toString(),
    };

    // Record success metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'post',
      'created',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: user.userId,
        tenantId: userData.currentTenantId,
        postType: type,
        duration: Date.now() - startTime
      }
    );

    return res.status(201).json(insertedPost);

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const appError = monitoringManager.error.createError(
      'system',
      'POST_CREATION_FAILED',
      'Error creating post',
      { error, userId: user?.userId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'post',
      'creation_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        userId: user?.userId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

export default createPostHandler;