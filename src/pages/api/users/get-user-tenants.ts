import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    // Token verification
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Database operations
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const user = await usersCollection.findOne({ userId: decodedToken.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tenants = await tenantsCollection.find({ tenantId: { $in: user.tenants } }).toArray();

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant',
      'fetch',
      tenants.length,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        operation: 'getUserTenants'
      }
    );

    return res.status(200).json(tenants);

  } catch (error) {
    // Record error metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'api',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'getUserTenants',
        errorType: error.name || 'unknown'
      }
    );

    return res.status(500).json({ error: 'Internal server error' });
  }
}