import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { AZURE_COSMOSDB_CONFIG } from '../constants/azureConstants';
import { DatabaseError } from '../MonitoringSystem/errors/specific';
import { mockDatabase } from '../mocks/mockDatabase';
import { useMockDatabase } from './mockConfig';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getCosmosClient(dbName?: string, withClient: boolean = false): Promise<{ db: Db; client?: MongoClient }> {
  if (useMockDatabase) {
    return { db: mockDatabase as unknown as Db };
  }

  const maxRetries = 3;
  let retries = 0;
  const startTime = Date.now();

  while (retries < maxRetries) {
    try {
      if (!cachedClient) {
        const { USERNAME, PASSWORD, HOST, DEFAULT_DB_NAME } = AZURE_COSMOSDB_CONFIG;
        if (!USERNAME || !PASSWORD || !HOST || !DEFAULT_DB_NAME) {
          throw new DatabaseError('Missing required environment variables for Azure Cosmos DB connection');
        }

        const connectionString = `mongodb://${USERNAME}:${PASSWORD}@${HOST}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retryWrites=false&maxIdleTimeMS=120000&appName=@${HOST}@`;

        const options: MongoClientOptions = {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 30000,
          maxPoolSize: 50,
          minPoolSize: 10,
        };

        cachedClient = new MongoClient(connectionString, options);
        await cachedClient.connect();

        // Record successful connection metric
        monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'database',
          'connection_success',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          { retries }
        );
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
      retries++;

      // Record retry metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'database',
        'connection_retry',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { retryAttempt: retries }
      );

      if (retries >= maxRetries) {
        // Record final failure metric
        monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'database',
          'connection_failure',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            totalRetries: retries
          }
        );

        throw new DatabaseError('Unable to connect to the database after multiple attempts');
      }

      // Clear cached client on error
      if (cachedClient) {
        try {
          await cachedClient.close();
        } catch (closeError) {
          // Ignore close errors
        }
        cachedClient = null;
        cachedDb = null;
      }

      // Exponential backoff with the same timing as before
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }

  throw new DatabaseError('Unable to connect to the database');
}

export async function closeCosmosClient(): Promise<void> {
  if (cachedClient) {
    try {
      await cachedClient.close();
      
      // Record successful closure
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'database',
        'connection_closed',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT
      );
    } catch (error) {
      // Record closure error
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'database',
        'connection_close_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    } finally {
      cachedClient = null;
      cachedDb = null;
    }
  }
}

// Graceful shutdown handlers - these are safe to add as they don't affect normal operation
if (typeof process !== 'undefined') {
  process.once('SIGINT', async () => {
    await closeCosmosClient();
  });

  process.once('SIGTERM', async () => {
    await closeCosmosClient();
  });
}