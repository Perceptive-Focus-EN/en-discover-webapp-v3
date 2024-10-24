// src/lib/api_s/reactions/postReactions.ts
import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { Reaction, EmotionId } from '../../../components/Feed/types/Reaction';

export const postReactionsApi = {
  fetch: async (postId: string): Promise<Reaction[]> => {
    const response = await axiosInstance.get(`/api/posts/${postId}/reactions`);
    return response.data;
  },

  fetchPostWithReactions: async (postId: string) => {
    const response = await axiosInstance.get(`/api/posts/${postId}`);
    return response.data;
  },

  update: async (postId: string, emotionId: EmotionId): Promise<Reaction[]> => {
    const response = await axiosInstance.post(
      `/api/posts/${postId}/reactions`, 
      { emotionId }
    );
    
    messageHandler.success('Reaction updated successfully');
    return response.data;
  }
};

// Usage example:
/*
try {
  // Fetch reactions (GET - no success message needed)
  const reactions = await postReactionsApi.fetch('post123');

  // Fetch post with reactions (GET - no success message needed)
  const post = await postReactionsApi.fetchPostWithReactions('post123');

  // Update reaction (POST - success message handled by API)
  await postReactionsApi.update('post123', 'happy');
} catch (error) {
  // Error already handled by axiosInstance
  // Just handle UI updates if needed
}
*/