// src/pages/api/azure/cosmos/createDatabase.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/middlewares/authMiddleware';
import rbacMiddleware from '@/middlewares/rbacMiddleware';
import { getCosmosClient } from '@/config/azureCosmosClient';

async function createDatabaseHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { databaseName } = req.body;
  try {
    const { client } = await getCosmosClient(undefined, true);
    if (!client) {
      throw new Error('Cosmos client is undefined');
    }
    const db = await client.db(databaseName);
    await db.command({ create: databaseName });
    res.status(200).json({ id: databaseName });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create database' });
  }
}

export default authMiddleware(rbacMiddleware('azureDatabaseAdministrator')(createDatabaseHandler));