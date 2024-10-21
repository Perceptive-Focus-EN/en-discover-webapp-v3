// src/pages/api/azure/storage/createStorageAccount.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/utils/ErrorHandling/logger';
import { createStorageAccount } from '@/config/azureStorage';
import { AZURE_RESOURCE_GROUP } from '@/constants/azureConstants';

async function createStorageAccountHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, location, replication } = req.body;
  try {
    await createStorageAccount(name, location, replication);
    logger.info(`Storage account ${name} created successfully in ${location}`);
    res.status(200).json({ message: `Storage account ${name} created successfully in ${location}` });
  } catch (error) {
    logger.error('Error creating storage account:', error);
    res.status(500).json({ message: 'Failed to create storage account' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(createStorageAccountHandler));