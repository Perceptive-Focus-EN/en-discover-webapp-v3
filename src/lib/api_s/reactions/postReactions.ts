// src/lib/api_s/reactions/postReactions.ts

import axiosInstance from '../../axiosSetup';
import { Reaction, EmotionId } from '../../../components/Feed/types/Reaction';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';

export const fetchPostReactions = async (postId: string): Promise<Reaction[]> => {
  try {
    const response = await axiosInstance.get(`/api/posts/${postId}/reactions`);
    return response.data;
  } catch (error) {
    frontendLogger.error(
      `Failed to fetch reactions for post ${postId}`,
      'Unable to load reactions. Please try again later.',
      { postId, error }
    );
    return [];
  }
};

// New function to fetch a single post with reaction counts
export const fetchPostWithReactions = async (postId: string) => {
  try {
    const response = await axiosInstance.get(`/api/posts/${postId}`);
    frontendLogger.info(
      `Post fetched successfully: ${postId}`,
      'Post details loaded.',
      { postId }
    );
    return response.data;
  } catch (error) {
    frontendLogger.error(
      `Failed to fetch post ${postId}`,
      'Unable to load post details. Please try again later.',
      { postId, error }
    );
    throw error;
  }
};


export const updatePostReaction = async (postId: string, emotionId: EmotionId): Promise<Reaction[]> => {
  try {
    const response = await axiosInstance.post(`/api/posts/${postId}/reactions`, { emotionId });
    frontendLogger.info(
      `Reaction updated for post ${postId}`,
      'Your reaction has been recorded.',
      { postId, emotionId }
    );
    return response.data;
  } catch (error) {
    frontendLogger.error(
      `Failed to update reaction for post ${postId}`,
      'Unable to save your reaction. Please try again later.',
      { postId, emotionId, error }
    );
    throw error;
  }
};