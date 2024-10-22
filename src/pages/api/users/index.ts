import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { UpdateUserInfoRequest, User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { logger } from '../../../utils/ErrorHandling/logger';

async function updateUserInfoHandler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedUserInfo | { error: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decodedToken = (req as any).user;

  try {
    const updatedInfo = req.body as UpdateUserInfoRequest;

    const client = await getCosmosClient();
    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ userId: decodedToken.userId }) as User | null;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser: User = {
      ...user,
      ...updatedInfo,
      updatedAt: new Date().toISOString()
    };

    const result = await usersCollection.findOneAndUpdate(
      { userId: decodedToken.userId },
      { $set: updatedUser },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(404).json({ error: 'Failed to update user' });
    }

    const extendedUserInfo: ExtendedUserInfo = {
      ...result.value,
      tenant: null,
      softDelete: null,
      reminderSent: false,
      reminderSentAt: '',
      userTypes: []
    };

    logger.info(`User info updated for user ${decodedToken.userId}`);
    res.status(200).json(extendedUserInfo);
  } catch (error) {
    logger.error(new Error('Error updating user info'), { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware(updateUserInfoHandler);