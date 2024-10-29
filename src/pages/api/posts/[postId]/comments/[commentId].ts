// src/pages/api/posts/[postId]/comments/[commentId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ObjectId } from 'mongodb';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { postId, commentId } = req.query;
  const { db } = await getCosmosClient();
  const commentsCollection = db.collection(COLLECTIONS.COMMENTS);

  try {
    // Validate token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken?.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get comment
    const comment = await commentsCollection.findOne({
      _id: new ObjectId(commentId as string),
      postId: new ObjectId(postId as string)
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verify ownership
    if (comment.userId !== decodedToken.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    switch (req.method) {
      case 'PUT':
        const { content } = req.body;
        const updatedComment = await commentsCollection.findOneAndUpdate(
          { _id: new ObjectId(commentId as string) },
          { 
            $set: { 
              content,
              updatedAt: new Date().toISOString(),
              isEdited: true
            } 
          },
          { returnDocument: 'after' }
        );

        if (!updatedComment || !updatedComment.value) {
          return res.status(500).json({ error: 'Failed to update comment' });
        }

        return res.status(200).json({
          ...updatedComment.value,
          id: updatedComment.value._id.toString(),
          postId: postId as string
        });

      case 'DELETE':
        await commentsCollection.deleteOne({
          _id: new ObjectId(commentId as string)
        });

        // Update post comment count
        await db.collection(COLLECTIONS.POSTS).updateOne(
          { _id: new ObjectId(postId as string) },
          { $inc: { commentCount: -1 } }
        );

        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Comment API error:', error);
    monitoringManager.logger.error(new Error('Comment API error'), error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}