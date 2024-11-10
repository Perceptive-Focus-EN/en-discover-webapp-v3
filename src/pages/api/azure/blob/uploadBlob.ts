// src/pages/api/azure/blob/uploadBlob.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { BlobServiceClient } from '@azure/storage-blob';

async function uploadBlobHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { blobName, data } = req.body;
  
  try {
    if (!azureBlobStorageInstance) {
      return res.status(500).json({ message: 'Azure Blob Storage instance is not initialized' });
    }
    await azureBlobStorageInstance.uploadBlob(blobName, Buffer.from(data));
    res.status(200).json({ message: 'Blob uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload blob' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(uploadBlobHandler));
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error('Azure Storage Connection string is not defined');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('your-container-name');

const azureBlobStorageInstance = {
  uploadBlob: async (blobName: string, data: Buffer) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data);
  },
};