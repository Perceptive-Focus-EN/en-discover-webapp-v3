// src/pages/api/azure/blob/createContainer.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { BlobServiceClient } from '@azure/storage-blob';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';

async function createContainerHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { containerName } = req.body;
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.create();
    res.status(200).json({ message: 'Container created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create container' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(createContainerHandler));
