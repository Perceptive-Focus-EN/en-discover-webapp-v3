// src/pages/api/uploads/index.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { queueVideoProcessing } from './video';
import { azureBlobStorageInstance, IAzureBlobStorage } from '@/config/azureStorage';

export const config = {
  api: {
    bodyParser: false,
  },
};

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per second
});

const allowedTypes = {
  image: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  video: ['mp4', 'mov', 'avi', 'wmv'],
};

const maxSizes = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const requestId = uuidv4();

  try {
    if (req.method !== 'POST') {
      const appError = monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        'Method not allowed'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference,
      });
    }

    try {
      await rateLimiter.consume(req.socket.remoteAddress || 'unknown');
    } catch {
      return res.status(429).json({ message: 'Too many requests' });
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
        reference: errorResponse.errorReference,
      });
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken?.userId) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference,
      });
    }

    return new Promise<void>((resolve, reject) => {
      const form = new IncomingForm({ multiples: false, maxFileSize: maxSizes.video });

      form.parse(req, async (err, fields, files) => {
        try {
          if (err) {
            throw monitoringManager.error.createError(
              'business',
              'FORM_PARSING_FAILED',
              'Failed to parse form data',
              { error: err }
            );
          }

          const type = Array.isArray(fields.type) ? fields.type[0] : fields.type || 'image';
          const file = Array.isArray(files.file) ? files.file[0] : files.file;

          if (!file) {
            throw monitoringManager.error.createError(
              'business',
              'VALIDATION_ERROR',
              'No file uploaded'
            );
          }

          const extension = file.originalFilename?.split('.').pop()?.toLowerCase();
          if (!extension || !allowedTypes[type as keyof typeof allowedTypes]?.includes(extension)) {
            throw monitoringManager.error.createError(
              'business',
              'VALIDATION_ERROR',
              'Invalid file type',
              { type, extension }
            );
          }

          if (file.size > maxSizes[type as keyof typeof maxSizes]) {
            throw monitoringManager.error.createError(
              'business',
              'VALIDATION_ERROR',
              'File too large',
              { size: file.size, maxSize: maxSizes[type as keyof typeof maxSizes] }
            );
          }

          if (!azureBlobStorageInstance) {
            throw monitoringManager.error.createError(
              'system',
              'STORAGE_UNAVAILABLE',
              'Storage service not available'
            );
          }

          const storage = azureBlobStorageInstance as IAzureBlobStorage;
          const blobName = `${type}s/${requestId}-${file.originalFilename}`;
          const uploadStart = Date.now();

          try {
            const uploadResponse = await storage.uploadFile(file, blobName);
            console.log('Uploaded file URL:', uploadResponse.data.url); // Debug log

            // Record upload duration metric
            monitoringManager.metrics.recordMetric(
              MetricCategory.PERFORMANCE,
              'upload',
              'duration',
              Date.now() - uploadStart,
              MetricType.HISTOGRAM,
              MetricUnit.MILLISECONDS,
              {
                type,
                size: file.size,
                userId: decodedToken.userId,
              }
            );

            // Handle video processing if needed
            let processingStatus;
            if (type === 'video') {
              const queued = await queueVideoProcessing(uploadResponse.data.url, requestId);
              processingStatus = queued ? 'queued' : 'pending';

              if (!queued) {
                monitoringManager.logger.warn('Video processing unavailable', {
                  requestId,
                  url: uploadResponse.data.url,
                });
              }
            }

            // Use the response directly without rewrapping it
            console.log('Response data:', uploadResponse); // Debug log

            // Record success metric
            monitoringManager.metrics.recordMetric(
              MetricCategory.BUSINESS,
              'upload',
              'success',
              1,
              MetricType.COUNTER,
              MetricUnit.COUNT,
              {
                type,
                size: file.size,
                processingStatus,
                userId: decodedToken.userId,
              }
            );

            // Send the response directly
            res.status(200).json(uploadResponse);
          } catch (uploadError) {
            throw monitoringManager.error.createError(
              'system',
              'UPLOAD_FAILED',
              'Failed to upload file to storage',
              { error: uploadError, blobName }
            );
          }
        } catch (error) {
          const appError = monitoringManager.error.createError(
            'system',
            'UPLOAD_FAILED',
            'Failed to process upload',
            { error, requestId }
          );
          const errorResponse = monitoringManager.error.handleError(appError);

          monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'upload',
            'error',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
              errorType: error instanceof Error ? error.name : 'unknown',
              userId: decodedToken.userId,
            }
          );

          res.status(errorResponse.statusCode).json({
            error: errorResponse.userMessage,
            reference: errorResponse.errorReference,
          });
        } finally {
          resolve();
        }
      });
    });
  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'REQUEST_FAILED',
      'Request processing failed',
      { error, requestId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference,
    });
  }
}
