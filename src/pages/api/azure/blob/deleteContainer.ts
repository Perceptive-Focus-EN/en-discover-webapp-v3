// src/pages/api/azure/blob/deleteContainer.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { BlobServiceClient } from '@azure/storage-blob';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/utils/ErrorHandling/logger';

async function deleteContainerHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { containerName } = req.query;
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
    const containerClient = blobServiceClient.getContainerClient(containerName as string);
    await containerClient.delete();
    logger.info(`Container ${containerName} deleted successfully`);
    res.status(200).json({ message: 'Container deleted successfully' });
  } catch (error) {
    logger.error('Error deleting container:', error);
    res.status(500).json({ message: 'Failed to delete container' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(deleteContainerHandler));
