import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { logger } from '../../../utils/ErrorHandling/logger';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';

async function fetchPostsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    logger.warn('No token provided for fetching posts');
    return res.status(401).json({ message: 'No token provided' });
  }

  const decodedToken = verifyAccessToken(token);
  if (!decodedToken) {
    logger.warn('Invalid token provided for fetching posts');
    return res.status(401).json({ message: 'Invalid token' });
  }

  const { page = '1', limit = '10', feedType = 'forYou', emotions = '' } = req.query;

  const pageNumber = parseInt(page as string, 10);
  const postsPerPage = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * postsPerPage;
  const activeEmotions = emotions ? (emotions as string).split(',').map(Number) : [];

  logger.info(`Fetching posts: page=${pageNumber}, limit=${postsPerPage}, feedType=${feedType}, emotions=${activeEmotions}`);

  try {
    const client = await getCosmosClient();
    const db = client.db;

    let query: any = {};

    if (feedType === 'following') {
      const userDoc = await db.collection(COLLECTIONS.POSTS).findOne({ _id: decodedToken.postId });
      if (userDoc && userDoc.following) {
        query.postId = { $in: userDoc.following };
      } else {
        logger.warn(`User not found or no following list available for user ${decodedToken.postId}`);
        return res.status(404).json({ error: 'User not found or no following list available' });
      }
    }else if (feedType === 'forYou') {
  // For simplicity, we'll show a mix of recent posts and posts from the user's network
  query.$or = [
    { postId: decodedToken.postId }, // User's own posts
    { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Posts from the last 7 days
  ];

  // If we have a 'following' array in the user document, we can include posts from followed users
  const userDoc = await db.collection(COLLECTIONS.POSTS).findOne({ _id: decodedToken.postId });
  if (userDoc && userDoc.following) {
      query.$or.push({ userId: { $in: userDoc.following } });
  }
}

      // Also include posts from followed users in the last 7 days

      if (activeEmotions.length > 0) {
  query.$or = [
    { 'content.mood': { $in: activeEmotions } },
    { postType: 'MOOD', 'content.mood': { $in: activeEmotions } }
  ];
      }

      const posts = await db.collection(COLLECTIONS.POSTS)
  .aggregate([
    { $match: query },
    {
      $lookup: {
        from: COLLECTIONS.REACTIONS,
        localField: '_id',
        foreignField: 'postId',
        as: 'reactions'
      }
    },
    {
      $addFields: {
        reactionCounts: {
          $map: {
            input: [1, 2, 3, 4, 5, 6, 7, 8],
            as: 'emotionId',
            in: {
              emotionId: '$$emotionId',
              count: {
                $size: {
                  $filter: {
                    input: '$reactions',
                    cond: { $eq: ['$$this.emotionId', '$$emotionId'] }
                  }
                }
              }
            }
          }
        }
      }
    },
    { $project: { reactions: 0 } },
    { $sort: { timestamp: -1 } },
    { $skip: skip },
    { $limit: postsPerPage }
  ]).toArray();

    logger.info(`Fetched ${posts.length} posts for page ${pageNumber}`);
      res.status(200).json(posts);
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
}

export default fetchPostsHandler;