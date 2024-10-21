import { NextApiRequest, NextApiResponse } from 'next';
import { WIDGET_TYPES } from '@/constants/widgetDefaults';
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

    if (method === 'GET') {
      res.status(200).json(WIDGET_TYPES);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}