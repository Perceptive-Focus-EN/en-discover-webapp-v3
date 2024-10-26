import { NextApiRequest, NextApiResponse } from 'next';
import { markAllNotificationsAsRead } from '../../../services/notificationService';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
    await markAllNotificationsAsRead(userId);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}