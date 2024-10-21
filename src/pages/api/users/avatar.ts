import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import azureBlobStorageInstance, { generateSasToken, azureStorageConfig } from '../../../config/azureBlobStorage';
import { Collection } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import fs from 'fs/promises';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../constants/collections';
import { logger } from '../../../utils/ErrorHandling/logger';

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        logger.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Error parsing form data' });
      }

      const file = files.avatar as any;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const client = await getCosmosClient();
      if (!client) {
        throw new Error('Failed to connect to the database');
      }

      const db = client.db;
      const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<ExtendedUserInfo>;
      const user = await usersCollection.findOne({ userId: decodedToken.userId });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const blobName = `${user.tenantId}/${decodedToken.userId}-${Date.now()}-${file.originalFilename}`;
      
      // Read file content
      const fileContent = await fs.readFile(file.filepath);

      // Upload to Azure Blob Storage
      if (azureBlobStorageInstance) {
        await azureBlobStorageInstance.uploadBlob(blobName, fileContent);
      } else {
        throw new Error('Azure Blob Storage instance is not initialized');
      }

      // Generate SAS token for the uploaded blob
      const sasToken = generateSasToken(
        azureStorageConfig.accountName,
        azureStorageConfig.accountKey,
        azureStorageConfig.containerName
      );

      const avatarUrl = `https://${azureStorageConfig.accountName}.blob.core.windows.net/${azureStorageConfig.containerName}/${blobName}?${sasToken}`;

      // Update user's avatar URL in the database
      await usersCollection.updateOne(
        { userId: decodedToken.userId },
        { $set: { avatarUrl: avatarUrl } }
      );

      res.status(200).json({ avatarUrl });
    });
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}