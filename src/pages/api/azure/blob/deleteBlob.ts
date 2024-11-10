// src/pages/api/azure/blob/deleteBlob.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import azureBlobStorageInstance from '@/config/azureBlobStorage';

async function deleteBlobHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { blobName } = req.query;

  try {
    if (!azureBlobStorageInstance) {
        return res.status(500).json({ message: 'Azure Blob Storage instance is not configured' });
    }
    await azureBlobStorageInstance.deleteBlob(blobName as string);
    res.status(200).json({ message: 'Blob deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete blob' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(deleteBlobHandler));