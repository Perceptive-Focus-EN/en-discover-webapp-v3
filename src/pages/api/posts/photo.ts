import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import azureBlobStorageInstance, { generateSasToken, azureStorageConfig } from '../../../config/azureBlobStorage';
import { Collection, WithId } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import fs from 'fs/promises';
import { COLLECTIONS } from '../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

export const config = {
  api: {
    bodyParser: false,
  },
};

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
});

const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    await rateLimiter.consume(req.socket.remoteAddress || 'unknown');
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'rate_limit',
      'exceeded',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { ip: req.socket.remoteAddress }
    );
    return res.status(429).json({ message: 'Too many requests' });
  }

  try {
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

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
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

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        const appError = monitoringManager.error.createError(
          'system',
          'FORM_PARSING_FAILED',
          'Error parsing form data',
          { error: err }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }

      const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;
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

      // File validation
      const fileExtension = file.originalFilename!.split('.').pop()!.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        const appError = monitoringManager.error.createError(
          'business',
          'VALIDATION_FAILED',
          'Invalid file type',
          { extension: fileExtension }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }

      if (file.size > maxFileSize) {
        const appError = monitoringManager.error.createError(
          'business',
          'VALIDATION_FAILED',
          'File size exceeds limit',
          { size: file.size, maxSize: maxFileSize }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }

      try {
        const client = await getCosmosClient();
        if (!client) {
          throw monitoringManager.error.createError(
            'system',
            'DATABASE_CONNECTION_FAILED',
            'Failed to connect to the database'
          );
        }

        const db = client.db;
        const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<ExtendedUserInfo>>;
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

        // Upload tracking
        const uploadStart = Date.now();
        const blobName = `${user.tenantId}/posts/${decodedToken.userId}-${Date.now()}-${uuidv4()}.${fileExtension}`;
        const fileContent = await fs.readFile(file.filepath);

        if (!azureBlobStorageInstance) {
          throw monitoringManager.error.createError(
            'system',
            'STORAGE_UNAVAILABLE',
            'Azure Blob Storage instance is not initialized'
          );
        }

        const photoUrl = await azureBlobStorageInstance.uploadBlob(blobName, fileContent);

        monitoringManager.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          'storage',
          'upload_duration',
          Date.now() - uploadStart,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          {
            userId: decodedToken.userId,
            fileSize: file.size,
            fileType: fileExtension
          }
        );

        const sasToken = generateSasToken(
          azureStorageConfig.accountName,
          azureStorageConfig.accountKey,
          azureStorageConfig.containerName
        );

        const photoUrlWithSas = `${photoUrl}?${sasToken}`;

        await usersCollection.updateOne(
          { userId: decodedToken.userId },
          { $push: { posts: { type: 'photo', url: photoUrlWithSas, timestamp: new Date() } } }
        );

        // Record success metric
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'photo',
          'upload_success',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            userId: decodedToken.userId,
            fileSize: file.size,
            duration: Date.now() - startTime
          }
        );

        return res.status(200).json({ 
          message: 'Photo uploaded successfully', 
          photoUrl: photoUrlWithSas 
        });

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
          'PHOTO_UPLOAD_FAILED',
          'Error processing upload',
          { error, userId: decodedToken.userId }
        );
        const errorResponse = monitoringManager.error.handleError(appError);

        monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'photo',
          'upload_error',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            errorType: error instanceof Error ? error.name : 'unknown',
            userId: decodedToken.userId
          }
        );

        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }
    });
  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const appError = monitoringManager.error.createError(
      'integration',
      'API_REQUEST_FAILED',
      'Request processing failed',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}