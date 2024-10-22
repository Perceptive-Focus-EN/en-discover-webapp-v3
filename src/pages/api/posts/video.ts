import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import azureBlobStorageInstance from '../../../config/azureBlobStorage';
import { Collection, WithId } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import fs from 'fs';
import { ServiceBusClient } from '@azure/service-bus';
import { COLLECTIONS } from '../../../constants/collections';

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
  logger.warn('AZURE_SERVICE_BUS_CONNECTION_STRING is not set. Video processing queue will not be available.');
}

async function queueVideoProcessingJob(blobName: string, userId: string): Promise<boolean> {
  if (!serviceBusClient) {
    logger.warn('Service Bus Client is not initialized. Skipping video processing queue.');
    return false;
  }

  try {
    const sender = serviceBusClient.createSender(serviceBusQueueName);
    await sender.sendMessages({
      body: { blobName, userId },
    });
    logger.info(`Video processing job queued successfully in ${serviceBusQueueName}`);
    return true;
  } catch (error) {
    logger.error(new Error(`Failed to queue video processing job in ${serviceBusQueueName}:`), { error });
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await rateLimiter.consume(req.socket.remoteAddress || 'unknown');
  } catch (error) {
    return res.status(429).json({ message: 'Too many requests' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decodedToken = verifyAccessToken(token);
  if (!decodedToken) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      logger.error(new Error('Request timed out'));
      res.status(500).json({ message: 'Request timed out' });
      resolve();
    }, 60000); // 60-second timeout

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      clearTimeout(timeout);
      if (err) {
        logger.error(new Error('Error parsing form data'), { error: err });
        res.status(500).json({ message: 'Error parsing form data' });
        return resolve();
      }

      const file = Array.isArray(files.video) ? files.video[0] : files.video;
      if (!file) {
        res.status(400).json({ message: 'No file uploaded' });
        return resolve();
      }

      const fileExtension = file.originalFilename!.split('.').pop()!.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        res.status(400).json({ message: 'Invalid file type' });
        return resolve();
      }

      if (file.size > maxFileSize) {
        res.status(400).json({ message: 'File size exceeds limit' });
        return resolve();
      }

      try {
        const client = await getCosmosClient();
        if (!client) {
          throw new Error('Failed to connect to the database');
        }

        const db = client.db;
        const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<ExtendedUserInfo>>;
        const user = await usersCollection.findOne({ userId: decodedToken.userId });

        if (!user) {
          res.status(404).json({ message: 'User not found' });
          return resolve();
        }

        const blobName = `${user.tenantId}/posts/${decodedToken.userId}-${Date.now()}-${uuidv4()}.${fileExtension}`;
        const fileContent = await fs.promises.readFile(file.filepath);

        if (!azureBlobStorageInstance) {
          throw new Error('Azure Blob Storage instance is not initialized');
        }

        await azureBlobStorageInstance.uploadBlob(blobName, fileContent);

        // Generate a URL for the uploaded video
        const videoUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;

        // Store only the blob name or relative path
        await usersCollection.updateOne(
          { userId: decodedToken.userId },
          { $push: { posts: { type: 'video', blobName: blobName, videoUrl: videoUrl, status: 'processing', timestamp: new Date() } } }
        );

        let processingStatus = 'unavailable';
        const queuedSuccessfully = await queueVideoProcessingJob(blobName, decodedToken.userId);
        processingStatus = queuedSuccessfully ? 'queued' : 'pending';

        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ 
          message: 'Video uploaded successfully',
          blobName: blobName,
          videoUrl: videoUrl, // Include the videoUrl in the response
          processingStatus
        });
        return resolve();
      } catch (error) {
        logger.error(new Error('Error processing upload'), { error, userId: decodedToken.userId });
        res.status(500).json({ message: 'Error processing upload' });
        return resolve();
      }
    });
  });
}
