import { logger } from '../MonitoringSystem/Loggers/logger';
import { getCosmosClient, closeCosmosClient } from '../config/azureCosmosClient';
import { Db, ClientSession, Collection } from 'mongodb';
import { DatabaseError } from '../MonitoringSystem/errors/specific';
import { ErrorType } from '@/MonitoringSystem/constants/errors';

export class TransactionManager {
  private db: Db | null = null;
  private collection: Collection | null = null;

  constructor(private databaseId: string, private collectionId: string) {}

  private async initClient(): Promise<void> {
    if (!this.db) {
      const { db } = await getCosmosClient(this.databaseId);
      this.db = db;
    }

    if (!this.collection) {
      this.collection = this.db.collection(this.collectionId);
      if (!this.collection) {
        throw new DatabaseError(`Failed to get collection: ${this.collectionId}`);
      }
    }
  }

  async executeTransaction<T>(
    operations: (session: ClientSession, collection: Collection) => Promise<T>
  ): Promise<T> {
    await this.initClient();
    const client = await getCosmosClient(this.databaseId);
    const session = client.client!.startSession();

    try {
      logger.info('Starting database transaction');
      let result: T;
      await session.withTransaction(async () => {
        result = await operations(session, this.collection!);
      });

      logger.info('Transaction committed successfully');
      return result!;
    } catch (error) {
      logger.error(new Error('Transaction aborted due to error'), ErrorType.TRANSACTION_ABORTED, { 
        message: (error as Error).message, 
        stack: (error as Error).stack 
      });
      throw new DatabaseError((error as Error).message);
    } finally {
      await session.endSession();
    }
  }

  async executeWithRetry<T>(
    operations: (session: ClientSession, collection: Collection) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeTransaction(operations);
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error(new Error('Transaction failed after maximum retries'), ErrorType.TRANSACTION_ABORTED, {
            message: (error as Error).message, 
            stack: (error as Error).stack 
          });
          throw new DatabaseError(`Transaction failed after ${maxRetries} attempts: ${(error as Error).message}`);
        }
        logger.warn(`Transaction attempt ${attempt} failed, retrying...`, { 
          message: (error as Error).message, 
          stack: (error as Error).stack 
        });
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }

    throw new DatabaseError('Transaction failed after maximum retries.');
  }

  async close(): Promise<void> {
    await closeCosmosClient();
    this.db = null;
    this.collection = null;
  }
}
