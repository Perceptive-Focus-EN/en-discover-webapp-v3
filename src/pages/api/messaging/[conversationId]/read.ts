// src/pages/api/messaging/[conversationId]/read.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken?.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { conversationId } = req.query;
    const { tenantId } = req.body;

    const { db } = await getCosmosClient();
    const conversationsCollection = db.collection('conversations');
    const messagesCollection = db.collection('messages');

    // Verify user belongs to conversation
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId as string),
      tenantId,
      'participants.userId': decodedToken.userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Update message read status
    await messagesCollection.updateMany(
      {
        conversationId: conversationId as string,
        receiverId: decodedToken.userId,
        read: false
      },
      {
        $set: { read: true }
      }
    );

    // Update conversation unread count
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId as string) },
      {
        $set: {
          [`participants.$[elem].unreadCount`]: 0
        }
      },
      {
        arrayFilters: [{ "elem.userId": decodedToken.userId }]
      }
    );

    // If there's an associated notification, mark it as read too
    // but don't wait for it
    if (conversation.notificationId) {
      fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId: conversation.notificationId })
      }).catch(() => {
        // Ignore notification errors - they shouldn't affect message status
        console.warn('Failed to mark notification as read');
      });
    }

    return res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}











