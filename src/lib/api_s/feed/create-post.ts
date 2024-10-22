// src/lib/api_s/posts/createPost.ts

import axiosInstance from '../../axiosSetup';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';
import axios from 'axios';
import { PostData, FeedPost } from '@/components/Feed/types/Post';
import { LOG_METRICS } from '@/constants/logging';

export const createPost = async (postData: PostData): Promise<FeedPost> => {
  const startTime = performance.now();
  frontendLogger.setContext({ postType: postData.postType });
  frontendLogger.increment(LOG_METRICS.POST_CREATION_ATTEMPTS);

  try {
    const response = await axiosInstance.post('/api/posts/create', {
      ...postData,
      user: {
        userId: postData.userId,
        // Include any other necessary user information
      },
    });

    const endTime = performance.now();
    frontendLogger.logPerformance(LOG_METRICS.POST_CREATION_DURATION, endTime - startTime);

    if (response.status === 201) {
      frontendLogger.info(
        'Post created successfully',
        'Your post has been published to the feed.',
        {
          postId: response.data.id,
          responseTime: endTime - startTime,
        }
      );
      frontendLogger.increment(LOG_METRICS.POST_CREATION_SUCCESS);
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    const endTime = performance.now();
    frontendLogger.logPerformance(LOG_METRICS.POST_CREATION_DURATION, endTime - startTime);
    frontendLogger.increment(LOG_METRICS.POST_CREATION_FAILURES);

    if (axios.isAxiosError(error)) {
      frontendLogger.error(
        'Failed to create post',
        'We encountered an issue while trying to publish your post. Please try again.',
        {
          errorStatus: error.response?.status,
          errorMessage: error.response?.data?.error || error.message,
          responseTime: endTime - startTime,
        }
      );
    } else {
      frontendLogger.error(
        'Failed to create post',
        'An unexpected error occurred while trying to publish your post.',
        {
          error: error instanceof Error ? error.message : String(error),
          responseTime: endTime - startTime,
        }
      );
    }

    throw error;
  } finally {
    frontendLogger.clearContext();
    frontendLogger.sendMetrics().catch(console.error);
  }
};
