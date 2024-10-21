import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import * as serverTokenUtils from '@/utils/TokenManagement/serverTokenUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
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
        const widgets = await collection.find({ userId }).toArray();
        res.status(200).json(widgets);
        break;
      case 'POST':
        const newWidget = { ...req.body, userId, createdAt: new Date() };
        const result = await collection.insertOne(newWidget);
        const insertedWidget = await collection.findOne({ _id: result.insertedId });
        res.status(201).json(insertedWidget);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}