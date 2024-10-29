// src/pages/api/posts/[postId]/comments/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ObjectId } from 'mongodb';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { Comment, CreateCommentDTO } from '../../../../../feature/posts/api/commentApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query;
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

    switch (req.method) {
      case 'GET':
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const [comments, totalCount] = await Promise.all([
          commentsCollection
            .find({ 
              postId: new ObjectId(postId as string),
              parentId: null // Only top-level comments
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          commentsCollection.countDocuments({ 
            postId: new ObjectId(postId as string),
            parentId: null
          })
        ]);

        return res.status(200).json({
          comments: comments.map(comment => ({
            ...comment,
            id: comment._id.toString(),
            postId: comment.postId.toString()
          })),
          hasMore: skip + comments.length < totalCount
        });

      case 'POST':
        const data = req.body as CreateCommentDTO;
        const newComment = {
          postId: new ObjectId(postId as string),
          userId: decodedToken.userId,
          content: data.content,
          parentId: data.parentId ? new ObjectId(data.parentId) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          replyCount: 0,
          isEdited: false,
          author: {
            name: decodedToken.username,
            avatar: decodedToken.avatar
          }
        };

        const result = await commentsCollection.insertOne(newComment);
        
        // Update post comment count
        await db.collection(COLLECTIONS.POSTS).updateOne(
          { _id: new ObjectId(postId as string) },
          { $inc: { commentCount: 1 } }
        );

        return res.status(201).json({
          ...newComment,
          id: result.insertedId.toString(),
          postId: postId as string
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Comments API error:', error);
    monitoringManager.logger.error(new Error('Comments API error'), error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}