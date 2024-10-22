
// src/pages/api/azure/blob/listContainers.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { BlobServiceClient } from '@azure/storage-blob';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/utils/ErrorHandling/logger';

async function listContainersHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
    const containers = [];
    for await (const container of blobServiceClient.listContainers()) {
      containers.push(container.name);
    }
    logger.info('Containers listed successfully');
    res.status(200).json(containers);
  } catch (error) {
    logger.error(new Error('Error listing containers'), { error });
    res.status(500).json({ message: 'Failed to list containers' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(listContainersHandler));
