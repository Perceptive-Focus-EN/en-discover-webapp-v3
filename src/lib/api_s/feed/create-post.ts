import axiosInstance from '../../axiosSetup';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';
import axios from 'axios';
import { PostData, FeedPost } from '@/components/Feed/types/Post';

export const createPost = async (postData: PostData): Promise<FeedPost> => {
  const startTime = performance.now();
  frontendLogger.setContext({ postType: postData.postType });
  frontendLogger.increment('post_creation_attempts');

  try {
    const response = await axiosInstance.post('/api/posts/create', {
      ...postData,
      user: {
        userId: postData.userId,
        // Include any other necessary user information
      }
    });
    
    const endTime = performance.now();
    frontendLogger.logPerformance('post_creation_duration', endTime - startTime);

    if (response.status === 201) {
      frontendLogger.info(
        'Post created successfully',
        'Your post has been published to the feed.',
        { 
          postId: response.data.id,
          responseTime: endTime - startTime 
        }
      );
      frontendLogger.increment('post_creation_success');
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    const endTime = performance.now();
    frontendLogger.logPerformance('post_creation_duration', endTime - startTime);
    frontendLogger.increment('post_creation_failures');

    if (axios.isAxiosError(error)) {
      frontendLogger.error(
        'Failed to create post',
        'We encountered an issue while trying to publish your post. Please try again.',
        {
          errorStatus: error.response?.status,
          errorMessage: error.response?.data?.error || error.message,
          responseTime: endTime - startTime
        }
      );
    } else {
      frontendLogger.error(
        'Failed to create post',
        'An unexpected error occurred while trying to publish your post.',
        { 
          error: error instanceof Error ? error.message : String(error),
          responseTime: endTime - startTime
        }
      );
    }

    throw error;
  } finally {
    frontendLogger.clearContext();
    frontendLogger.sendMetrics().catch(console.error);
  }
};

// EXAMPLE USAGE

// createPost({
//   postType: 'badge',
//   content: {
//     badgeName: 'Achievement Unlocked',
//     badgeImage: 'path/to/badge/image.png',
//     description: 'You\'ve reached a new milestone!',
//     badgeType: 'achievement'
//   },
//   userId: currentUser.id
// });

// createPost({
//   postType: 'text',
//   content: {
//     text: 'This is a text post',
//     backgroundColor: 'bg-blue-500'
//   },
//   userId: currentUser.id
// });

