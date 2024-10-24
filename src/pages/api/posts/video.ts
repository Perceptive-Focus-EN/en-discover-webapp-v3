import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import azureBlobStorageInstance from '../../../config/azureBlobStorage';
import { Collection, WithId } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import fs from 'fs';
import { ServiceBusClient } from '@azure/service-bus';
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
  points: 5,
  duration: 1,
});

const allowedExtensions = ['mp4', 'mov', 'avi', 'wmv'];
const maxFileSize = 100 * 1024 * 1024; // 100MB

let serviceBusClient: ServiceBusClient | null = null;
const serviceBusQueueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'AetheriQBusQueue';

if (process.env.AZURE_SERVICE_BUS_CONNECTION_STRING) {
  serviceBusClient = new ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING);
} else {
  monitoringManager.logger.warn('Service Bus configuration missing', {
    type: 'SERVICE_BUS_CONFIG_MISSING',
    detail: 'Video processing queue will not be available'
  });
}

async function queueVideoProcessingJob(blobName: string, userId: string): Promise<boolean> {
  const queueStart = Date.now();

  if (!serviceBusClient) {
    monitoringManager.logger.warn('Service Bus Client not initialized', {
      type: 'SERVICE_BUS_UNAVAILABLE',
      detail: 'Skipping video processing queue'
    });
    return false;
  }

  try {
    const sender = serviceBusClient.createSender(serviceBusQueueName);
    await sender.sendMessages({
      body: { blobName, userId },
    });

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'video',
      'queued',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        blobName
      }
    );

    return true;
  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'QUEUE_OPERATION_FAILED',
      'Failed to queue video processing job',
      { error, userId, blobName }
    );
    monitoringManager.logger.error(appError, appError.type);
    return false;
  } finally {
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'queue',
      'operation_duration',
      Date.now() - queueStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS
    );
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const requestId = uuidv4();

  try {
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

    // Rate limiting
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

    // Auth validation
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

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        const appError = monitoringManager.error.createError(
          'system',
          'REQUEST_TIMEOUT',
          'Request timed out',
          { requestId }
        );
        const errorResponse = monitoringManager.error.handleError(appError);
        res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
        resolve();
      }, 60000);

      const form = new IncomingForm();
      form.parse(req, async (err, fields, files) => {
        clearTimeout(timeout);

        try {
          if (err) {
            throw monitoringManager.error.createError(
              'business',
              'FORM_PARSING_FAILED',
              'Error parsing form data',
              { error: err }
            );
          }

          const file = Array.isArray(files.video) ? files.video[0] : files.video;
          if (!file) {
            throw monitoringManager.error.createError(
              'business',
              'VALIDATION_FAILED',
              'No file uploaded'
            );
          }

          // File validation
          const fileExtension = file.originalFilename!.split('.').pop()!.toLowerCase();
          if (!allowedExtensions.includes(fileExtension)) {
            throw monitoringManager.error.createError(
              'business',
              'VALIDATION_FAILED',
              'Invalid file type',
              { extension: fileExtension }
            );
          }

          if (file.size > maxFileSize) {
            throw monitoringManager.error.createError(
              'business',
              'VALIDATION_FAILED',
              'File size exceeds limit',
              { size: file.size, maxSize: maxFileSize }
            );
          }

          // Database operations
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
            throw monitoringManager.error.createError(
              'business',
              'USER_NOT_FOUND',
              'User not found',
              { userId: decodedToken.userId }
            );
          }

          // Upload tracking
          const uploadStart = Date.now();
          const blobName = `${user.tenantId}/posts/${decodedToken.userId}-${Date.now()}-${uuidv4()}.${fileExtension}`;
          const fileContent = await fs.promises.readFile(file.filepath);

          if (!azureBlobStorageInstance) {
            throw monitoringManager.error.createError(
              'system',
              'STORAGE_UNAVAILABLE',
              'Azure Blob Storage instance is not initialized'
            );
          }

          await azureBlobStorageInstance.uploadBlob(blobName, fileContent);

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

          const videoUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;

          // Update user record
          await usersCollection.updateOne(
            { userId: decodedToken.userId },
            { 
              $push: { 
                posts: { 
                  type: 'video', 
                  blobName: blobName, 
                  videoUrl: videoUrl, 
                  status: 'processing', 
                  timestamp: new Date() 
                } 
              } 
            }
          );

          // Queue processing
          let processingStatus = 'unavailable';
          const queuedSuccessfully = await queueVideoProcessingJob(blobName, decodedToken.userId);
          processingStatus = queuedSuccessfully ? 'queued' : 'pending';

          // Record success metrics
          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'video',
            'upload_success',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
              userId: decodedToken.userId,
              fileSize: file.size,
              processingStatus,
              duration: Date.now() - startTime
            }
          );

          res.status(200).json({ 
            message: 'Video uploaded successfully',
            blobName: blobName,
            videoUrl: videoUrl,
            processingStatus
          });
          resolve();

        } catch (error) {
          if (AppError.isAppError(error)) {
            const errorResponse = monitoringManager.error.handleError(error);
            res.status(errorResponse.statusCode).json({
              error: errorResponse.userMessage,
              reference: errorResponse.errorReference
            });
          } else {
            const appError = monitoringManager.error.createError(
              'system',
              'VIDEO_UPLOAD_FAILED',
              'Error processing upload',
              { error, userId: decodedToken.userId }
            );
            const errorResponse = monitoringManager.error.handleError(appError);

            monitoringManager.metrics.recordMetric(
              MetricCategory.SYSTEM,
              'video',
              'upload_error',
              1,
              MetricType.COUNTER,
              MetricUnit.COUNT,
              {
                errorType: error instanceof Error ? error.name : 'unknown',
                userId: decodedToken.userId
              }
            );

            res.status(errorResponse.statusCode).json({
              error: errorResponse.userMessage,
              reference: errorResponse.errorReference
            });
          }
          resolve();
        }
      });
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
      'API) REQUEST_FAILED',
      'Request processing failed',
      { error, requestId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}