// pages/api/tenants/[tenantId]/nfc-access.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../../constants/collections';
import { authMiddleware } from '../../../../middlewares/authMiddleware';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { DatabaseError, ValidationError } from '../../../../errors/errors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { method: req.method, endpoint: 'nfc-access' });
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tenantId } = req.query;
  const { nfcId } = req.body;

  if (!tenantId || !nfcId) {
    logger.error(new Error('Missing required parameters'), { tenantId, nfcId });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ 
      currentTenantId: tenantId, 
      nfcId: nfcId 
    });

    if (user) {
      logger.info('NFC access granted', { tenantId, nfcId, userId: user.userId });
      res.status(200).json({
        accessGranted: true,
        userData: {
          name: `${user.firstName} ${user.lastName}`,
          role: user.title,
          department: user.accountType,
        }
      });
    } else {
      logger.warn('NFC access denied', { tenantId, nfcId });
      res.status(200).json({ accessGranted: false });
    }

    // Log performance metric
    const duration = Date.now() - startTime;
    logger.info('nfc_access_duration', { duration });

  } catch (error) {
    let errorToLog: Error;

    if (error instanceof Error) {
      errorToLog = error;
    } else {
      errorToLog = new Error(String(error));
    }

    if (errorToLog.name === 'MongoError' || errorToLog.name === 'MongoServerError') {
      errorToLog = new DatabaseError(errorToLog.message);
    }

    logger.error(errorToLog, {
      tenantId,
      nfcId,
      endpoint: 'nfc-access',
    });

    res.status(500).json({ 
      message: 'Internal server error',
      error: errorToLog.message,
    });
  }
}

export default authMiddleware(handler);