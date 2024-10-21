// pages/api/getVideoUrl.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { generateSasToken, azureStorageConfig } from '../../../config/azureBlobStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { blobName } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decodedToken = verifyAccessToken(token);
  if (!decodedToken) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Here, add logic to check if the user is authorized to access this video

  const sasToken = generateSasToken(
    azureStorageConfig.accountName,
    azureStorageConfig.accountKey,
    azureStorageConfig.containerName
  );

  const videoUrlWithSas = `https://${azureStorageConfig.accountName}.blob.core.windows.net/${azureStorageConfig.containerName}/${blobName}?${sasToken}`;

  res.status(200).json({ videoUrl: videoUrlWithSas });
}