// pages/api/emotion-analytics/recent-entries.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { logger } from '../../../utils/ErrorHandling/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { tenantId, limit = 10 } = req.query;

  if (!tenantId) {
    return res.status(400).json({ message: 'Missing tenantId' });
  }

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection('Users');
    const moodEntriesCollection = db.collection('moodEntry');

    // Find the user with the given tenantId
    const user = await usersCollection.findOne({ tenantId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use the user's currentTenantId to fetch mood entries
    const entries = await moodEntriesCollection.find({
      userId: user.userId,
      tenantId: user.currentTenantId
    })
    .sort({ date: -1 })
    .limit(Number(limit))
    .toArray();

    res.status(200).json(entries);
  } catch (error) {
    logger.error("Error fetching recent mood entries:", { tenantId, error });
    res.status(500).json({ message: 'Internal Server Error' });
  }
}