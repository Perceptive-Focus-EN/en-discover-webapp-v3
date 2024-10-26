// src/pages/api/azure/blob/listBlobs.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/MonitoringSystem/Loggers/logger';
import azureBlobStorageInstance from '@/config/azureStorage';

async function listBlobsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { prefix = '' } = req.query;
  
  try {
    if (!azureBlobStorageInstance) {
        return res.status(500).json({ message: 'Azure Blob Storage instance is not configured' });
    }
    const blobs = await azureBlobStorageInstance.listBlobs(prefix as string);
    logger.info('Blobs listed successfully');
    res.status(200).json(blobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list blobs' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(listBlobsHandler));