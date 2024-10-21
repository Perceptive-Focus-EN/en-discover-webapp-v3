// src/pages/api/redis.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import redis from '../../config/azureRedis'; // Import the configured Redis instance

async function getRedisClient() {
  if (redis && redis.status === 'ready') {
    return redis;
  }
  throw new Error('Redis client is not ready');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!redis) {
    return res.status(500).json({ error: 'Redis client not initialized' });
  }

  try {
    const client = await getRedisClient();

    // Handle token-related operations
    if (req.query.action) {
      switch (req.query.action) {
        case 'storeToken':
          if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
          }
          try {
            const { userId, token } = req.body;
            await client.set(`user:token:${userId}`, token, 'EX', 60 * 60 * 24 * 7); // expires in 7 days
            return res.status(200).json({ message: 'Token stored successfully' });
          } catch (error) {
            console.error('Error storing token:', error);
            return res.status(500).json({ error: 'Failed to store token' });
          }

        case 'removeToken':
          if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
          }
          try {
            const { userId } = req.body;
            await client.del(`user:token:${userId}`);
            return res.status(200).json({ message: 'Token removed successfully' });
          } catch (error) {
            console.error('Error removing token:', error);
            return res.status(500).json({ error: 'Failed to remove token' });
          }

        case 'getToken':
          if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method Not Allowed' });
          }
          try {
            const { userId } = req.query;
            const token = await client.get(`user:token:${userId}`);
            return res.status(200).json({ token });
          } catch (error) {
            console.error('Error getting token:', error);
            return res.status(500).json({ error: 'Failed to get token' });
          }
      }
    }

    // Handle general Redis operations
    if (req.method === 'POST') {
      const { action, key, value, expiryTime } = req.body;
      switch (action) {
        case 'get':
          const result = await client.get(key);
          return res.status(200).json({ value: result });

        case 'set':
          if (expiryTime) {
            await client.setex(key, expiryTime, value);
          } else {
            await client.set(key, value);
          }
          return res.status(200).json({ success: true });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    // If no matching action is found
    return res.status(404).json({ error: 'Not Found' });

  } catch (error) {
    console.error('Redis operation failed:', error);
    return res.status(500).json({ error: 'Redis operation failed' });
  }
}