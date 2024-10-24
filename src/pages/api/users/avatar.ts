import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import azureBlobStorageInstance, { generateSasToken, azureStorageConfig } from '../../../config/azureBlobStorage';
import { Collection } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import fs from 'fs/promises';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function uploadAvatarHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    const appError = monitoringManager.error.createError(
      'security',
      'AUTH_UNAUTHORIZED',
      'No token provided'
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  try {
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Wrap form parsing in a promise
    const formData = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const file = (formData as any).files.avatar;
    if (!file) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'No file uploaded'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const client = await getCosmosClient();
    if (!client) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Failed to connect to the database'
      );
    }

    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<ExtendedUserInfo>;
    const user = await usersCollection.findOne({ userId: decodedToken.userId });

    if (!user) {
      const appError = monitoringManager.error.createError(
        'business',
        'USER_NOT_FOUND',
        'User not found',
        { userId: decodedToken.userId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const blobName = `${user.tenantId}/${decodedToken.userId}-${Date.now()}-${file.originalFilename}`;
    const fileContent = await fs.readFile(file.filepath);

    if (!azureBlobStorageInstance) {
      throw monitoringManager.error.createError(
        'system',
        'SERVICE_UNAVAILABLE',
        'Azure Blob Storage instance is not initialized'
      );
    }

    // Upload to Azure Blob Storage
    await azureBlobStorageInstance.uploadBlob(blobName, fileContent);

    // Generate SAS token
    const sasToken = generateSasToken(
      azureStorageConfig.accountName,
      azureStorageConfig.accountKey,
      azureStorageConfig.containerName
    );

    const avatarUrl = `https://${azureStorageConfig.accountName}.blob.core.windows.net/${azureStorageConfig.containerName}/${blobName}?${sasToken}`;

    // Update user's avatar URL
    await usersCollection.updateOne(
      { userId: decodedToken.userId },
      { $set: { avatarUrl: avatarUrl } }
    );

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'avatar',
      'upload',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        fileSize: fileContent.length,
        success: true
      }
    );

    return res.status(200).json({ avatarUrl });

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
      'FILE_UPLOAD_FAILED',
      'Error uploading avatar',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'avatar',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'upload',
        errorType: error.name || 'unknown'
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}