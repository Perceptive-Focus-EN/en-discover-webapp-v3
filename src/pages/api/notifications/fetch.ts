import { NextApiRequest, NextApiResponse } from 'next';
import { fetchNotifications } from '../../../services/notificationService';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decoded.userId;
    const limit = Number(req.query.limit) || 20;
    const skip = Number(req.query.skip) || 0;

    const notifications = await fetchNotifications(userId, limit, skip);
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}