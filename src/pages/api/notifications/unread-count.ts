import { NextApiRequest, NextApiResponse } from 'next';
import { fetchUnreadNotificationCount } from '../../../services/notificationService';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';

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
    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decoded.userId;
    const count = await fetchUnreadNotificationCount(userId);

    res.status(200).json({ count });
  } catch (error) {
    logger.error(new Error('Error fetching unread notification count'), { error });
    res.status(500).json({ message: 'Internal server error' });
  }
}