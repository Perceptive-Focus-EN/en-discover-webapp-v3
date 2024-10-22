// src/pages/api/azure/blob/uploadBlob.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/utils/ErrorHandling/logger';
import azureBlobStorageInstance from '@/config/azureStorage';

async function uploadBlobHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { blobName, data } = req.body;
  
  try {
    if (!azureBlobStorageInstance) {
      logger.error(new Error('Azure Blob Storage instance is not initialized.'));
      return res.status(500).json({ message: 'Azure Blob Storage instance is not initialized' });
    }
    await azureBlobStorageInstance.uploadBlob(blobName, Buffer.from(data));
    logger.info(`Blob ${blobName} uploaded successfully.`);
    res.status(200).json({ message: 'Blob uploaded successfully' });
  } catch (error) {
    logger.error(new Error('Error uploading blob'), { error });
    res.status(500).json({ message: 'Failed to upload blob' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(uploadBlobHandler));