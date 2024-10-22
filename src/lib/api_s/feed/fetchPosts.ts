import axiosInstance from '../../axiosSetup';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';
import { FeedPost } from '@/components/Feed/types/Post';
import { LOG_METRICS } from '@/constants/logging';

export const fetchPostsFromAPI = async (
  page: number,
  postsPerPage: number,
  feedType: string,
  activeEmotions: number[],
  postId?: string,
  userId?: string,
  tenantId?: string
): Promise<FeedPost[]> => {
  const startTime = performance.now();
  try {
    const params: Record<string, any> = {
      page,
      limit: postsPerPage,
      feedType,
      emotions: activeEmotions.join(',')
    };

    if (userId) params.userId = userId;
    if (tenantId) params.tenantId = tenantId;

    const url = postId ? `/api/posts/${postId}` : '/posts';

    const response = await axiosInstance.get<FeedPost | FeedPost[]>(url, { params });
    
    const endTime = performance.now();
    frontendLogger.logPerformance(LOG_METRICS.FETCH_POSTS_DURATION, endTime - startTime);

    const posts = response.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [];

    frontendLogger.info(
      'Posts fetched successfully',
      `Loaded ${posts.length} posts for page ${page}`,
      {
        page,
        postsCount: posts.length,
        responseTime: endTime - startTime
      }
    );

    return posts;
  } catch (error) {
    const endTime = performance.now();
    frontendLogger.logPerformance(LOG_METRICS.FETCH_POSTS_DURATION, endTime - startTime);
    frontendLogger.error(
      'Failed to fetch posts',
      'We encountered an issue while trying to load posts. Please try again.',
      {
        page,
        error: error instanceof Error ? error.message : String(error),
        responseTime: endTime - startTime
      }
    );
    throw error;
  }
};