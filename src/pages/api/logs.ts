
// src/pages/api/logs.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../config/azureCosmosClient';
import { COLLECTIONS } from '../../constants/collections';
import { AnyBulkWriteOperation, Document } from 'mongodb';
import { ERROR_MESSAGES } from '../../constants/errorMessages';
import * as CustomErrors from '../../errors/errors';
import { HTTP_STATUS } from '../../constants/logging';
import { LogEntry } from '../../types/logging';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  const { logs } = req.body;

  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.INVALID_LOG_FORMAT });
  }

  try {
    const { db } = await getCosmosClient();
    const logsCollection = db.collection(COLLECTIONS.LOGS);

    const bulkOps: AnyBulkWriteOperation<Document>[] = logs.map((log: LogEntry) => ({
      updateOne: {
        filter: {
          systemId: log.systemId,
          tenantId: log.tenantId,
          userId: log.userId
        },
        update: {
          $setOnInsert: {
            systemName: log.systemName,
            environment: log.environment,
            createdAt: new Date()
          },
          $addToSet: {
            logs: {
              level: log.level,
              message: log.message,
              userMessage: log.userMessage,
              timestamp: new Date(log.timestamp),
              metadata: log.metadata || {}
            }
          },
          $set: { updatedAt: new Date() }
        },
        upsert: true
      }
    }));

    const result = await logsCollection.bulkWrite(bulkOps, { ordered: false });
    console.log('Logs stored successfully', { count: logs.length, upserted: result.upsertedCount, modified: result.modifiedCount });
    res.status(HTTP_STATUS.OK).json({ message: 'Logs stored successfully', upserted: result.upsertedCount, modified: result.modifiedCount });
  } catch (error) {
    console.error('Error storing logs:', error);
    if (error instanceof CustomErrors.DatabaseError) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: ERROR_MESSAGES.DATABASE_CONNECTION });
    } else if (error instanceof CustomErrors.ValidationError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.INVALID_LOG_FORMAT });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: ERROR_MESSAGES.FAILED_TO_STORE_LOGS });
    }
  }
}
