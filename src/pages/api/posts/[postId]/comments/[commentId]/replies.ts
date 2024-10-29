// src/pages/api/posts/[postId]/comments/[commentId]/replies.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ObjectId } from 'mongodb';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { BusinessError, SecurityError, SystemError } from '@/MonitoringSystem/constants/errors';
import { Security } from '@mui/icons-material';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postId, commentId } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const { db } = await getCosmosClient();
    const commentsCollection = db.collection(COLLECTIONS.COMMENTS);

    const [replies, totalCount] = await Promise.all([
      commentsCollection
        .find({
          postId: new ObjectId(postId as string),
          parentId: new ObjectId(commentId as string)
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      commentsCollection.countDocuments({
        postId: new ObjectId(postId as string),
        parentId: new ObjectId(commentId as string)
      })
    ]);

    return res.status(200).json({
      replies: replies.map(reply => ({
        ...reply,
        id: reply._id.toString(),
        postId: reply.postId.toString(),
        parentId: reply.parentId.toString()
      })),
      hasMore: skip + replies.length < totalCount
    });
  } catch (error) {
    console.error('Replies API error:', error);
    monitoringManager.logger.error(
        new Error('Replies API error'),
        SecurityError.API_REQUEST_FAILED,
        { error }
    );
    return res.status(500).json({ error: 'Internal server error' });
  }
}