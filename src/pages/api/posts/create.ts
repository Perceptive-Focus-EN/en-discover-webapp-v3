import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { logger } from '../../../utils/ErrorHandling/logger';
import { User } from '../../../types/User/interfaces';
import { ObjectId } from 'mongodb';

async function createPostHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, type, content, ...otherData } = req.body;

  if (!user || !user.userId) {
    return res.status(400).json({ error: 'Missing user information' });
  }

  try {
    const client = await getCosmosClient();
    const db = client.db;

    if (!type || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const postsCollection = db.collection(COLLECTIONS.POSTS);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Fetch user data
    const userData = await usersCollection.findOne({ userId: user.userId }) as User | null;
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userData.currentTenantId) {
      return res.status(400).json({ error: 'User does not have a current tenant' });
    }

    const newPost = {
      userId: userData.userId,
      tenantId: userData.currentTenantId,
      username: `${userData.firstName} ${userData.lastName}`,
      userAvatar: userData.avatarUrl || '',
      type,
      content,
      timestamp: new Date().toISOString(),
      // Remove the reactions field as we'll handle reactions separately
      ...otherData
    };

    const result = await postsCollection.insertOne(newPost);

    if (!result.insertedId) {
      throw new Error('Failed to insert post');
    }

    const insertedPost = {
      ...newPost,
      _id: result.insertedId,
      id: result.insertedId.toString(), // Adding 'id' field for Cosmos DB partitioning
    };

    logger.info(`Post created successfully: ${result.insertedId}`);
    res.status(201).json(insertedPost);
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
}

export default createPostHandler;