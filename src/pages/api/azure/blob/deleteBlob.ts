// src/pages/api/azure/blob/deleteBlob.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/utils/ErrorHandling/logger';
import azureBlobStorageInstance from '@/config/azureStorage';

async function deleteBlobHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { blobName } = req.query;

  try {
    if (!azureBlobStorageInstance) {
        logger.error('Azure Blob Storage instance is null');
        return res.status(500).json({ message: 'Azure Blob Storage instance is not configured' });
    }
    await azureBlobStorageInstance.deleteBlob(blobName as string);
    logger.info(`Blob ${blobName} deleted successfully.`);
    res.status(200).json({ message: 'Blob deleted successfully' });
  } catch (error) {
    logger.error('Error deleting blob:', error);
    res.status(500).json({ message: 'Failed to delete blob' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(deleteBlobHandler));