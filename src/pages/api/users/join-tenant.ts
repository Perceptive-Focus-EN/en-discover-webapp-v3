import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { logger } from '../../../utils/ErrorHandling/logger';
import { User } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';

async function tenantHandler(req: NextApiRequest, res: NextApiResponse) {
  const decodedToken = (req as any).user;

  switch (req.method) {
    case 'GET':
      return await searchTenants(req, res, decodedToken);
    case 'POST':
      return await sendJoinRequest(req, res, decodedToken);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function searchTenants(req: NextApiRequest, res: NextApiResponse, decodedToken: any) {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const { db } = await getCosmosClient();
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const tenants = await tenantsCollection.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { domain: { $regex: searchTerm, $options: 'i' } }
      ]
    }).project({
      tenantId: 1,
      name: 1,
      domain: 1,
      industry: 1,
      type: 1
    }).toArray();

    res.status(200).json(tenants);
  } catch (error) {
    logger.error(new Error('Error searching tenants'), { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendJoinRequest(req: NextApiRequest, res: NextApiResponse, decodedToken: any) {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const tenant = await tenantsCollection.findOne({ tenantId }) as Tenant | null;
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const user = await usersCollection.findOne({ userId: decodedToken.userId }) as User | null;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member or has a pending request
    if (user.tenants.includes(tenantId) || user.connectionRequests.sent.includes(tenantId)) {
      return res.status(400).json({ error: 'Already a member or request pending' });
    }

    // Add pending request to user
    await usersCollection.updateOne(
      { userId: decodedToken.userId },
      { $addToSet: { 'connectionRequests.sent': tenantId } }
    );

    // Add pending request to tenant
    await tenantsCollection.updateOne(
      { tenantId },
      { $addToSet: { pendingUserRequests: decodedToken.userId } }
    );

    logger.info(`User ${decodedToken.userId} sent join request to tenant ${tenantId}`);
    res.status(200).json({ message: 'Join request sent successfully' });
  } catch (error) {
    logger.error(new Error('Error sending join request'), { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}
export default authMiddleware(tenantHandler);