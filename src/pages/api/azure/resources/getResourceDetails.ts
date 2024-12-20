// src/pages/api/azure/resources/getResourceDetails.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ResourceManagementClient } from '@azure/arm-resources';
import { DefaultAzureCredential } from '@azure/identity';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { AZURE_SUBSCRIPTION_ID } from '@/constants/azureConstants';

async function getResourceDetailsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { resourceId } = req.query;

  try {
    const credential = new DefaultAzureCredential();
    const client = new ResourceManagementClient(credential, AZURE_SUBSCRIPTION_ID);
    const resource = await client.resources.getById(resourceId as string, '2021-04-01');
    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get resource details' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(getResourceDetailsHandler));