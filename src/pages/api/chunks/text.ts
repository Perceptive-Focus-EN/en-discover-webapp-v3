import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { Collection, WithId } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import { COLLECTIONS } from '../../../constants/collections';

export const config = {
  api: {
    bodyParser: false,
  },
};

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await rateLimiter.consume(req.socket.remoteAddress || 'unknown');
  } catch (error) {
    return res.status(429).json({ message: 'Too many requests' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        logger.error('Error parsing form data:', { error: err });
        return res.status(500).json({ message: 'Error parsing form data' });
      }

      const chunk = fields.chunk;
      if (!chunk || typeof chunk !== 'string') {
        return res.status(400).json({ message: 'No text chunk provided' });
      }

      try {
        const client = await getCosmosClient();
        if (!client) {
          throw new Error('Failed to connect to the database');
        }

        const db = client.db;
        const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<ExtendedUserInfo>>;
        const user = await usersCollection.findOne({ userId: decodedToken.userId });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const chunkId = uuidv4();
        const timestamp = new Date();

        await usersCollection.updateOne(
          { userId: decodedToken.userId },
          { 
            $push: { 
              textChunks: { 
                chunkId, 
                content: chunk, 
                timestamp 
              } 
            } 
          }
        );

        return res.status(200).json({ message: 'Text chunk uploaded successfully', chunkId });
      } catch (error) {
        logger.error('Error processing text chunk upload:', { error, userId: decodedToken.userId });
        return res.status(500).json({ message: 'Error processing text chunk upload' });
      }
    });
  } catch (error) {
    logger.error('Error in request handling:', { error });
    return res.status(401).json({ message: (error as Error).message });
  }
}