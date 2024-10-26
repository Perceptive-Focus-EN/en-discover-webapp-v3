// src/pages/api/azure/functions/listFunctions.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebSiteManagementClient } from '@azure/arm-appservice';
import { DefaultAzureCredential } from '@azure/identity';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { AZURE_SUBSCRIPTION_ID } from '@/constants/azureConstants';

async function listFunctionsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  try {
    const credential = new DefaultAzureCredential();
    const client = new WebSiteManagementClient(credential, AZURE_SUBSCRIPTION_ID);
    const functionApps = await client.webApps.list();
    res.status(200).json(functionApps);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list function apps' });
  }
}

export default authMiddleware(rbacMiddleware('azureDevOpsEngineer')(listFunctionsHandler));