import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import azureBlobStorageInstance, { generateSasToken, azureStorageConfig } from '../../../config/azureBlobStorage';
import { Collection, WithId } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import fs from 'fs/promises';
import { COLLECTIONS } from '../../../constants/collections';

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
        logger.error('Error parsing form data:', { error: err });
        return res.status(500).json({ message: 'Error parsing form data' });
      }

      const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;
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
        const client = await getCosmosClient();
        if (!client) {
          throw new Error('Failed to connect to the database');
        }

        const db = client.db;
        const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<ExtendedUserInfo>>;
        const user = await usersCollection.findOne({ userId: decodedToken.userId });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const blobName = `${user.tenantId}/posts/${decodedToken.userId}-${Date.now()}-${uuidv4()}.${fileExtension}`;
        const fileContent = await fs.readFile(file.filepath);

        let photoUrl: string;
        if (azureBlobStorageInstance) {
          photoUrl = await azureBlobStorageInstance.uploadBlob(blobName, fileContent);
        } else {
          throw new Error('Azure Blob Storage instance is not initialized');
        }

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

        return res.status(200).json({ message: 'Photo uploaded successfully', photoUrl: photoUrlWithSas });
      } catch (error) {
        logger.error('Error processing upload:', { error, userId: decodedToken.userId });
        return res.status(500).json({ message: 'Error processing upload' });
      }
    });
  } catch (error) {
    logger.error('Error in request handling:', { error });
    return res.status(401).json({ message: (error as Error).message });
  }
}