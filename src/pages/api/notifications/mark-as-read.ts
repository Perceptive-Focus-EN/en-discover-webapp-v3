import { NextApiRequest, NextApiResponse } from 'next';
import { markNotificationAsRead } from '../../../services/notificationService';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../MonitoringSystem/Loggers/logger';

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

    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    await markNotificationAsRead(notificationId);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error(new Error('Error marking notification as read'), { error });
    res.status(500).json({ message: 'Internal server error' });
  }
}