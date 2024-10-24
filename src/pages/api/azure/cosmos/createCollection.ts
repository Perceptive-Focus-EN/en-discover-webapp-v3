// src/pages/api/azure/cosmos/createCollection.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/MonitoringSystem/Loggers/logger';

async function createCollectionHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { databaseName, containerName } = req.body;
    const { db } = await getCosmosClient(databaseName);
    await db.createCollection(containerName);
    logger.info(`Collection "${containerName}" created successfully in database "${databaseName}"`);
    res.status(200).json({
      message: `Collection "${containerName}" created successfully in database "${databaseName}".`,
    });
  } catch (error) {
    logger.error(new Error('Error creating collection'), { error });
    res.status(500).json({ error: (error as Error).message });
  }
}

export default authMiddleware(rbacMiddleware('azureDatabaseAdministrator')(createCollectionHandler));
