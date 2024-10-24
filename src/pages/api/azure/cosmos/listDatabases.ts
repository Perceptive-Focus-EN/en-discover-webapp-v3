// src/pages/api/azure/cosmos/listDatabases.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { logger } from '@/MonitoringSystem/Loggers/logger';
import { getCosmosClient } from '@/config/azureCosmosClient';

async function listDatabasesHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { client } = await getCosmosClient(undefined, true);
    if (!client) {
      throw new Error('Cosmos client is undefined');
    }
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    const databases = result.databases.map(db => db.name);
    logger.info('Databases listed successfully');
    res.status(200).json(databases);
  } catch (error) {
    logger.error(new Error('Error listing databases'), { error });
    res.status(500).json({ message: 'Failed to list databases' });
  }
}

export default authMiddleware(rbacMiddleware('azureDatabaseAdministrator')(listDatabasesHandler));