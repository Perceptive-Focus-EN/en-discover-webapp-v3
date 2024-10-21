// src/utils/DBCommands/createCollections.ts

import { getCosmosClient } from '../../config/azureCosmosClient';
import { logger } from '../ErrorHandling/logger';
import { DatabaseError } from '../../errors/errors';

async function createCollectionIfNotExists(dbName: string, collectionName: string) {
  try {
    const { db } = await getCosmosClient(dbName);
    
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some((col) => col.name === collectionName);

    if (!collectionExists) {
      await db.createCollection(collectionName);
      logger.info(`Collection "${collectionName}" created in database "${dbName}".`);
    } else {
      logger.info(`Collection "${collectionName}" already exists in database "${dbName}".`);
    }
  } catch (error) {
    logger.error('Error creating collection:', error);
    throw new DatabaseError(`Failed to create or check collection "${collectionName}" in database "${dbName}"`);
  }
}

export { createCollectionIfNotExists };
