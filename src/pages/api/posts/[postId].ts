import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { logger } from '../../../utils/ErrorHandling/logger';
import { ObjectId } from 'mongodb';

async function getPostHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postId } = req.query;

  if (!postId || typeof postId !== 'string') {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  try {
    const client = await getCosmosClient();
    const db = client.db;

    const post = await db.collection(COLLECTIONS.POSTS).aggregate([
      { $match: { _id: new ObjectId(postId) } },
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
      { $project: { reactions: 0 } } // Remove the detailed reactions array
    ]).next();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    logger.info(`Post fetched successfully: ${postId}`);
    res.status(200).json(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
}

export default getPostHandler;




// 
// 
// import { NextApiRequest, NextApiResponse } from 'next';
// import { getCosmosClient } from '../../../config/azureCosmosClient';
// import { COLLECTIONS } from '@/constants/collections';
// import { logger } from '../../../utils/ErrorHandling/logger';
// import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
// 
// async function getUserPostsHandler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'GET') {
    // return res.status(405).json({ error: 'Method not allowed' });
//   }
// 
//   const { tenantId } = req.query;
//   const userId = req.query.userId as string;
// 
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) {
    // logger.warn('No token provided for fetching posts');
    // return res.status(401).json({ message: 'No token provided' });
//   }
// 
//   const decodedToken = verifyAccessToken(token);
//   if (!decodedToken) {
    // logger.warn('Invalid token provided for fetching posts');
    // return res.status(401).json({ message: 'Invalid token' });
//   }
// 
//   logger.info(`Attempting to fetch posts for tenant: ${tenantId}, user: ${userId}`);
// 
//   if (!tenantId || typeof tenantId !== 'string' || !userId) {
    // logger.error(`Invalid tenantId: ${tenantId} or userId: ${userId}`);
    // return res.status(400).json({ error: 'Invalid tenant ID or user ID' });
//   }
// 
//   try {
    // const client = await getCosmosClient();
    // const db = client.db;
// 
    // const query = { tenantId, userId };
// 
    // const posts = await db.collection(COLLECTIONS.POSTS).aggregate([
    //   { $match: query },
    //   {
        // $lookup: {
        //   from: COLLECTIONS.REACTIONS,
        //   localField: '_id',
        //   foreignField: 'postId',
        //   as: 'reactions'
        // }
    //   },
    //   {
        // $addFields: {
        //   reactionCounts: {
            // $map: {
            //   input: [1, 2, 3, 4, 5, 6, 7, 8],
            //   as: 'emotionId',
            //   in: {
                // emotionId: '$$emotionId',
                // count: {
                //   $size: {
                    // $filter: {
                    //   input: '$reactions',
                    //   cond: { $eq: ['$$this.emotionId', '$$emotionId'] }
                    // }
                //   }
                // }
            //   }
            // }
        //   }
        // }
    //   },
    //   { $project: { reactions: 0 } },
    //   { $sort: { timestamp: -1 } } // Sort by most recent first
    // ]).toArray();
// 
    // if (posts.length === 0) {
    //   logger.warn(`No posts found for tenant: ${tenantId}, user: ${userId}`);
    //   return res.status(404).json({ error: 'No posts found' });
    // }
// 
    // logger.info(`Fetched ${posts.length} posts for tenant: ${tenantId}, user: ${userId}`);
    // res.status(200).json(posts);
//   } catch (error) {
    // logger.error('Error fetching posts:', error);
    // res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
//   }
// }
// 
// export default getUserPostsHandler;