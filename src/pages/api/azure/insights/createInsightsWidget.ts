// src/pages/api/azure/insights/createInsightsWidget.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ApplicationInsightsManagementClient } from '@azure/arm-appinsights';
import { DefaultAzureCredential } from '@azure/identity';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/MonitoringSystem/Loggers/logger';

async function createInsightsWidgetHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { resourceGroup, name, location } = req.body;
  try {
    const credential = new DefaultAzureCredential();
    const client = new ApplicationInsightsManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID!);
    const result = await client.components.createOrUpdate(resourceGroup, name, {
      location: location,
      kind: 'web',
      applicationType: 'web'
    });
    logger.info(`Application Insights component ${name} created successfully`);
    res.status(200).json(result);
  } catch (error) {
    logger.error(new Error('Error creating Application Insights component'), { error });
    res.status(500).json({ message: 'Failed to create Application Insights component' });
  }
}

export default authMiddleware(rbacMiddleware('azureAdministrator')(createInsightsWidgetHandler));
