import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { BlobServiceClient } from '@azure/storage-blob';
import { ServiceBusClient } from '@azure/service-bus';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';

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

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
const serviceBusClient = new ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!);

async function uploadToBlobStorage(file: any, userId: string): Promise<string> {
  const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME!);
  const blobName = `${userId}/${uuidv4()}-${file.originalFilename}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.uploadFile(file.filepath, {
    blobHTTPHeaders: { blobContentType: file.mimetype }
  });

  return blockBlobClient.url;
}

async function queueProcessingJob(blobUrl: string, userId: string) {
  const sender = serviceBusClient.createSender('avatar-processing');
  await sender.sendMessages({
    body: { blobUrl, userId }
  });
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

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        logger.error(new Error('Error parsing form data'), { error: err });
        return res.status(500).json({ message: 'Error parsing form data' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileExtension = file.originalFilename!.split('.').pop()!.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ message: 'Invalid file type' });
      }

      if (file.size > maxFileSize) {
        return res.status(400).json({ message: 'File size exceeds limit' });
      }

      try {
        const blobUrl = await uploadToBlobStorage(file, decodedToken.userId);
        await queueProcessingJob(blobUrl, decodedToken.userId);
        
        res.status(200).json({ message: 'Avatar uploaded successfully', blobUrl });
      } catch (error) {
        logger.error(new Error('Error processing upload'), { error, userId: decodedToken.userId });
        res.status(500).json({ message: 'Error processing upload' });
      }
    });
  } catch (error) {
    logger.error(new Error('Error in request handling'), { error });
    res.status(401).json({ message: (error as Error).message });
  }
}
