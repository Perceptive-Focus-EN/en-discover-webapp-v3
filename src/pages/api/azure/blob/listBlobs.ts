// src/pages/api/azure/blob/listBlobs.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import azureBlobStorageInstance from '@/config/azureBlobStorage';
import { BlobServiceClient } from '@azure/storage-blob';

async function listBlobsInContainer(containerName: string) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  let blobs = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    blobs.push(blob.name);
  }

  return blobs;
}
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { containerName } = req.query;

  if (!containerName) {
    return res.status(400).json({ message: 'Container name is required' });
  }

  try {
    const blobs = await listBlobsInContainer(containerName as string);
    res.status(200).json(blobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list blobs', error: error.message });
  }
}

const listBlobsHandler = authMiddleware(rbacMiddleware('azureAdministrator')(handler));
export default listBlobsHandler;
