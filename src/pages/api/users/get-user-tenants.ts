import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { Tenant } from '@/types/Tenant/interfaces';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = crypto.randomUUID();

  // Log the request method and URL
  console.log(`[${requestId}] - Incoming request: ${req.method} ${req.url}`);

  // Check if the request method is GET
  if (req.method !== 'GET') {
    console.error(`[${requestId}] - Invalid request method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract the authorization token from the request headers
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error(`[${requestId}] - No authorization token provided`);
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    console.log(`[${requestId}] - Fetching user tenants started`);

    // Verify the access token
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
      console.error(`[${requestId}] - Invalid token provided`);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    console.log(`[${requestId}] - Token verified for user: ${decodedToken.userId}`);

    // Get the Cosmos DB client and collections
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    // Fetch the user document from the database
    const user = await usersCollection.findOne({ userId: decodedToken.userId });
    if (!user) {
      console.error(`[${requestId}] - User not found: ${decodedToken.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[${requestId}] - User found: ${decodedToken.userId}`);

    // Extract tenant associations from the user document
    const userTenants = user.tenants.associations || {};
    const tenantIds = Object.keys(userTenants).filter(tenantId => 
      tenantId !== user.userId && tenantId === user.tenants.context.currentTenantId
    );

    if (tenantIds.length === 0) {
      console.warn(`[${requestId}] - No accessible tenant associations for user: ${user.userId}`);
      return res.status(403).json({ error: 'Unauthorized access to tenants' });
    }

    // Fetch active tenants from the database
    const tenants = (await tenantsCollection
      .find({ 
        tenantId: { $in: tenantIds },
        isDeleted: { $ne: true },
        isActive: true
      })
      .toArray()).map(doc => ({
        tenantId: doc.tenantId,
        ownership: doc.ownership,
        members: doc.members,
        membersCount: doc.membersCount,
        details: doc.details,
        isDeleted: doc.isDeleted,
        isActive: doc.isActive,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      })) as Tenant[];

    console.log(`[${requestId}] - Found ${tenants.length} active tenants for user: ${user.userId}`);

    // Enhance tenant data with user's role and association info
    const enhancedTenants = tenants.map(tenant => {
      const association = user.tenants.associations[tenant.tenantId];
      return {
        ...tenant,
        userRole: association?.role || null,
        userAccessLevel: association?.accessLevel || null,
        joinedAt: association?.joinedAt || null,
        lastActiveAt: association?.lastActiveAt || null
      };
    });

    // Record metric for successful tenant fetch
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant',
      'fetch',
      enhancedTenants.length,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        operation: 'getUserTenants',
        requestId
      }
    );

    console.log(`[${requestId}] - Successfully returned tenants: ${enhancedTenants.map(tenant => tenant.tenantId).join(', ')}`);
    return res.status(200).json({
      tenantIds: tenantIds,
      tenants: enhancedTenants
    });

  } catch (error) {
    console.error(`[${requestId}] - Error in getUserTenants:`, error);

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Failed to fetch user tenants',
      { error, requestId }
    );

    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(500).json({
      error: errorResponse.userMessage
    });
  }
}
