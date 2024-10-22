// src/config/azureCosmosClient.ts
import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { AZURE_COSMOSDB_CONFIG } from '../constants/azureConstants';
import { logger } from '../utils/ErrorHandling/logger';
import { DatabaseError } from '../errors/errors';
import { mockDatabase } from '../mocks/mockDatabase';
import { useMockDatabase } from './mockConfig';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getCosmosClient(dbName?: string, withClient: boolean = false): Promise<{ db: Db; client?: MongoClient }> {
  if (useMockDatabase) {
    logger.info('Using mock database');
    return { db: mockDatabase as unknown as Db };
  }

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      if (!cachedClient) {
        const { USERNAME, PASSWORD, HOST, DEFAULT_DB_NAME } = AZURE_COSMOSDB_CONFIG;
        if (!USERNAME || !PASSWORD || !HOST || !DEFAULT_DB_NAME) {
          throw new DatabaseError('Missing required environment variables for Azure Cosmos DB connection');
        }

        const connectionString = `mongodb://${USERNAME}:${PASSWORD}@${HOST}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retryWrites=false&maxIdleTimeMS=120000&appName=@${HOST}@`;
        logger.info('Connecting to database...');

        const options: MongoClientOptions = {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 30000,
        };

        cachedClient = new MongoClient(connectionString, options);
        await cachedClient.connect();
        logger.info('Connected to database successfully');
      }

      // Check if the client is still connected by pinging the server
      await cachedClient.db().command({ ping: 1 });

      if (!cachedDb) {
        const dbNameToUse = dbName || AZURE_COSMOSDB_CONFIG.DEFAULT_DB_NAME;
        if (!dbNameToUse) {
          throw new DatabaseError('No database name provided and no default set');
        }
        cachedDb = cachedClient.db(dbNameToUse);
      }

      return withClient ? { client: cachedClient, db: cachedDb } : { db: cachedDb };
    } catch (error) {
      logger.error(new Error(`Failed to connect to the database (Attempt ${retries + 1}/${maxRetries})`), { error });
      retries++;
      if (retries >= maxRetries) {
        throw new DatabaseError('Unable to connect to the database after multiple attempts');
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
    }
  }

  throw new DatabaseError('Unable to connect to the database');
}

export async function closeCosmosClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    logger.info('Closed database connection');
  }
}

