import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import * as serverTokenUtils from '@/utils/TokenManagement/serverTokenUtils';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query: { widgetId } } = req;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || !widgetId) {
    return res.status(401).json({ error: 'Unauthorized or missing widgetId' });
  }

  try {
    const decodedToken = serverTokenUtils.verifyAccessToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const isBlacklisted = await serverTokenUtils.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token is blacklisted' });
    }

    const userId = decodedToken.userId;

    const { db } = await getCosmosClient();
    const collection = db.collection(COLLECTIONS.WIDGETS);

    switch (method) {
      case 'GET':
        const widget = await collection.findOne({ _id: new ObjectId(widgetId as string), userId });
        if (widget) {
          res.status(200).json(widget);
        } else {
          res.status(404).json({ error: 'Widget not found' });
        }
        break;
      case 'PUT':
        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(widgetId as string), userId },
          { $set: { ...req.body, updatedAt: new Date() } },
          { returnDocument: 'after' }
        );
        if (result && result.value) {
          res.status(200).json(result.value);
        } else {
          res.status(404).json({ error: 'Widget not found' });
        }
        break;
      case 'DELETE':
        const deleteResult = await collection.deleteOne({ _id: new ObjectId(widgetId as string), userId });
        if (deleteResult.deletedCount > 0) {
          res.status(204).end();
        } else {
          res.status(404).json({ error: 'Widget not found' });
        }
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}