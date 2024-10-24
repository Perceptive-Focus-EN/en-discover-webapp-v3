// src/pages/api/azure/functions/deleteFunction.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebSiteManagementClient } from '@azure/arm-appservice';
import { DefaultAzureCredential } from '@azure/identity';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/MonitoringSystem/Loggers/logger';
import { AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP } from '@/constants/azureConstants';

async function deleteFunctionHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { name } = req.query;
  
  try {
    const credential = new DefaultAzureCredential();
    const client = new WebSiteManagementClient(credential, AZURE_SUBSCRIPTION_ID);
    
    // Use the delete method instead of beginDeleteAndWait
    await client.webApps.delete(AZURE_RESOURCE_GROUP, name as string);
    
    logger.info(`Function app ${name} deletion initiated successfully`);
    res.status(202).json({ message: 'Function app deletion initiated successfully' });
  } catch (error) {
    logger.error(new Error('Error deleting function app'), { error });
    res.status(500).json({ message: 'Failed to initiate function app deletion' });
  }
}

export default authMiddleware(rbacMiddleware('azureDevOpsEngineer')(deleteFunctionHandler));