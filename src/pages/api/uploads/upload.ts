import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { BlobServiceClient } from '@azure/storage-blob';
import { ServiceBusClient } from '@azure/service-bus';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

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
const maxFileSize = 5 * 1024 * 1024; // 5MB

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

const serviceBusClient = new ServiceBusClient(
  process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!
);

async function uploadToBlobStorage(file: any, userId: string): Promise<string> {
  const containerClient = blobServiceClient.getContainerClient(
    process.env.AZURE_STORAGE_CONTAINER_NAME!
  );
  const blobName = `${userId}/${uuidv4()}-${file.originalFilename}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const startTime = Date.now();
  try {
    await blockBlobClient.uploadFile(file.filepath, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    monitoringManager.metrics.recordMetric(
      MetricCategory.RESOURCE,
      'blob',
      'upload_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId, fileType: file.mimetype }
    );

    return blockBlobClient.url;
  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'BLOB_STORAGE_UPLOAD_FAILED',
      'Failed to upload file to blob storage',
      { userId, error, blobName }
    );
    monitoringManager.error.handleError(appError);
    throw error;
  }
}

async function queueProcessingJob(blobUrl: string, userId: string) {
  const sender = serviceBusClient.createSender('avatar-processing');
  try {
    await sender.sendMessages({
      body: { blobUrl, userId }
    });

    monitoringManager.metrics.recordMetric(
      MetricCategory.MESSAGING,
      'service_bus',
      'message_sent',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { userId, messageType: 'avatar-processing' }
    );
  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'SERVICE_BUS_SEND_FAILED',
      'Failed to queue avatar processing job',
      { userId, blobUrl, error }
    );
    monitoringManager.error.handleError(appError);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Method validation
  if (req.method !== 'POST') {
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'request',
      'invalid_method',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { method: req.method }
    );
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Rate limiting
  try {
    await rateLimiter.consume(req.socket.remoteAddress || 'unknown');
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
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
    // Auth validation
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      throw new Error('Invalid token');
    }

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        const appError = monitoringManager.error.createError(
          'system',
          'FORM_PARSING_FAILED',
          'Failed to parse form data',
          { error: err, requestId }
        );
        monitoringManager.error.handleError(appError);
        return res.status(500).json({ message: 'Error parsing form data' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        monitoringManager.metrics.recordMetric(
          MetricCategory.SECURITY,
          'upload',
          'missing_file',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { userId: decodedToken.userId }
        );
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Validation checks
      const fileExtension = file.originalFilename!.split('.').pop()!.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        monitoringManager.metrics.recordMetric(
          MetricCategory.SECURITY,
          'upload',
          'invalid_file_type',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { userId: decodedToken.userId, fileType: fileExtension }
        );
        return res.status(400).json({ message: 'Invalid file type' });
      }

      if (file.size > maxFileSize) {
        monitoringManager.metrics.recordMetric(
          MetricCategory.SECURITY,
          'upload',
          'file_size_exceeded',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { userId: decodedToken.userId, fileSize: file.size }
        );
        return res.status(400).json({ message: 'File size exceeds limit' });
      }

      try {
        const blobUrl = await uploadToBlobStorage(file, decodedToken.userId);
        await queueProcessingJob(blobUrl, decodedToken.userId);

        // Record successful upload
        monitoringManager.metrics.recordMetric(
          MetricCategory.API,
          'upload',
          'success',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { userId: decodedToken.userId }
        );

        // Record total processing time
        monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'upload',
          'total_duration',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          { userId: decodedToken.userId }
        );

        res.status(200).json({ message: 'Avatar uploaded successfully', blobUrl });
      } catch (error) {
        const appError = monitoringManager.error.createError(
          'system',
          'UPLOAD_PROCESSING_FAILED',
          'Failed to process upload',
          { 
            error, 
            userId: decodedToken.userId,
            requestId,
            duration: Date.now() - startTime
          }
        );
        monitoringManager.error.handleError(appError);
        res.status(500).json({ message: 'Error processing upload' });
      }
    });
  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'AUTH_VALIDATION_FAILED',
      (error as Error).message,
      { requestId, duration: Date.now() - startTime }
    );
    monitoringManager.error.handleError(appError);
    res.status(401).json({ message: (error as Error).message });
  }
}