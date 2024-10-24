// src/pages/api/azure/storage/listStorageAccounts.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { StorageManagementClient } from '@azure/arm-storage';
import { DefaultAzureCredential } from '@azure/identity';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/MonitoringSystem/Loggers/logger';
import { AZURE_SUBSCRIPTION_ID } from '@/constants/azureConstants';

async function listStorageAccountsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const credential = new DefaultAzureCredential();
    const client = new StorageManagementClient(credential, AZURE_SUBSCRIPTION_ID);
    const result = await client.storageAccounts.list();
    const accounts = [];
    for await (const account of result) {
      accounts.push(account);
    }
    logger.info('Storage accounts listed successfully');
    res.status(200).json(accounts);
  } catch (error) {
    logger.error(new Error('Error listing storage accounts'), { error });
    res.status(500).json({ message: 'Failed to list storage accounts' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(listStorageAccountsHandler));