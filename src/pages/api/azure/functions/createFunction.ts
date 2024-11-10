// src/pages/api/azure/functions/createFunction.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebSiteManagementClient } from '@azure/arm-appservice';
import { DefaultAzureCredential } from '@azure/identity';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';

async function createFunctionHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { resourceGroup, name, location } = req.body;
  try {
    const credential = new DefaultAzureCredential();
    const client = new WebSiteManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID!);
    const result = await client.webApps.beginCreateOrUpdateAndWait(resourceGroup, name, {
      location: location,
      kind: 'functionapp',
      siteConfig: {
        appSettings: [
          { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' },
          { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~14' }
        ]
      }
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create Function App' });
  }
}

export default authMiddleware(rbacMiddleware('azureDevOpsEngineer')(createFunctionHandler));
