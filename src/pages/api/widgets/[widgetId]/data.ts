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

    if (method === 'GET') {
      const widget = await collection.findOne({ _id: new ObjectId(widgetId as string), userId });
      if (widget) {
        // Here you would typically fetch and process the widget's data
        // For this example, we're just returning the widget object
        res.status(200).json(widget);
      } else {
        res.status(404).json({ error: 'Widget not found' });
      }
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}