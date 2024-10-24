// src/lib/api_s/feed/index.ts
import axiosInstance from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { FeedPost, PostData } from '@/components/Feed/types/Post';

export const feedApi = {
  // Posts
  fetchPosts: async (
    page: number,
    postsPerPage: number,
    feedType: string,
    activeEmotions: number[],
    postId?: string,
    userId?: string,
    tenantId?: string
  ): Promise<FeedPost[]> => {
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
    
    return Array.isArray(response.data) ? response.data : [response.data];
  },

  createPost: async (postData: PostData): Promise<FeedPost> => {
    const response = await axiosInstance.post('/api/posts/create', {
      ...postData,
      user: {
        userId: postData.userId,
      },
    });

    messageHandler.success('Post created successfully');
    return response.data;
  },

  // Connections
  connections: {
    send: async (userId: string): Promise<void> => {
      await axiosInstance.post(API_ENDPOINTS.SEND_CONNECTION_REQUEST, { userId });
      messageHandler.success('Connection request sent');
    },

    accept: async (userId: string): Promise<void> => {
      await axiosInstance.post(API_ENDPOINTS.ACCEPT_CONNECTION_REQUEST, { userId });
      messageHandler.success('Connection request accepted');
    },

    getAll: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_CONNECTIONS);
      return response.data;
    },

    getRequests: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_CONNECTION_REQUESTS);
      return response.data;
    }
  }
};

// Usage example:
/*
try {
  // Fetch posts
  const posts = await feedApi.fetchPosts(1, 10, 'recent', [1, 2, 3]);

  // Create post
  const newPost = await feedApi.createPost({
    content: 'Hello world',
    userId: '123'
  });
  // Success message handled by API

  // Connection operations
  await feedApi.connections.send('user123');
  // Success message handled by API
  
  await feedApi.connections.accept('user123');
  // Success message handled by API
  
  const connections = await feedApi.connections.getAll();
  const requests = await feedApi.connections.getRequests();
} catch (error) {
  // Error already handled by axiosInstance
  // Just handle UI updates if needed
}
*/