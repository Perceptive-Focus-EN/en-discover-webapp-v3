// src/pages/api/azure/storage/createStorageAccount.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { AZURE_RESOURCE_GROUP } from '@/constants/azureConstants';
import { DefaultAzureCredential } from '@azure/identity';
import { StorageManagementClient } from '@azure/arm-storage';

async function createStorageAccountHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, location, replication } = req.body;
  try {
    await createStorageAccount(name, location, replication);
    res.status(200).json({ message: `Storage account ${name} created successfully in ${location}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create storage account' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(createStorageAccountHandler));
async function createStorageAccount(name: string, location: string, replication: string) {
  const credential = new DefaultAzureCredential();
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  if (!subscriptionId) {
    throw new Error('AZURE_SUBSCRIPTION_ID is not defined');
  }
  const client = new StorageManagementClient(credential, subscriptionId);

  const resourceGroupName = AZURE_RESOURCE_GROUP;
  const parameters = {
    sku: {
      name: replication,
    },
    kind: 'StorageV2',
    location: location,
  };

  await client.storageAccounts.beginCreate(resourceGroupName, name, parameters);
}