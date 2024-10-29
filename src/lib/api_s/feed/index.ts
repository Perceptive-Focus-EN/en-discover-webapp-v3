// src/lib/api_s/feed/index.ts
import { api } from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { FeedPost, BasePost } from '@/feature/types/Post';

interface FetchPostsParams {
  page: number;
  limit: number;
  feedType: string;
  emotions: string;
  userId?: string;
  tenantId?: string;
}

interface ConnectionResponse {
  success: boolean;
  message: string;
}

interface Connection {
  userId: string;
  status: string;
  createdAt: string;
}

interface ConnectionRequest {
  id: string;
  fromUserId: string;
  status: string;
  createdAt: string;
}

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
    const params: FetchPostsParams = {
      page,
      limit: postsPerPage,
      feedType,
      emotions: activeEmotions.join(',')
    };

    if (userId) params.userId = userId;
    if (tenantId) params.tenantId = tenantId;

    const url = postId ? `/api/posts/${postId}` : '/posts';
    
    try {
      const response = await api.get<FeedPost | FeedPost[]>(url, { params });
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      messageHandler.error('Failed to fetch posts');
      throw error;
    }
  },

  createPost: async (postData: BasePost): Promise<FeedPost> => {
    try {
      const response = await api.post<FeedPost>(
        '/api/posts/create',
        {
          ...postData,
          user: {
            userId: postData.userId,
          },
        }
      );
      
      messageHandler.success('Post created successfully');
      return response;
    } catch (error) {
      messageHandler.error('Failed to create post');
      throw error;
    }
  },

  updatePost: async (postId: string, updateData: Partial<BasePost>): Promise<FeedPost> => {
    try {
      const response = await api.put<FeedPost>(
        `/api/posts/${postId}`,
        updateData
      );
      
      messageHandler.success('Post updated successfully');
      return response;
    } catch (error) {
      messageHandler.error('Failed to update post');
      throw error;
    }
  },

  deletePost: async (postId: string): Promise<void> => {
    try {
      await api.delete(`/api/posts/${postId}`);
      messageHandler.success('Post deleted successfully');
    } catch (error) {
      messageHandler.error('Failed to delete post');
      throw error;
    }
  },

  // Connections
  connections: {
    send: async (userId: string): Promise<ConnectionResponse> => {
      try {
        const response = await api.post<ConnectionResponse>(
          API_ENDPOINTS.SEND_CONNECTION_REQUEST,
          { userId }
        );
        messageHandler.success('Connection request sent');
        return response;
      } catch (error) {
        messageHandler.error('Failed to send connection request');
        throw error;
      }
    },

    accept: async (userId: string): Promise<ConnectionResponse> => {
      try {
        const response = await api.post<ConnectionResponse>(
          API_ENDPOINTS.ACCEPT_CONNECTION_REQUEST,
          { userId }
        );
        messageHandler.success('Connection request accepted');
        return response;
      } catch (error) {
        messageHandler.error('Failed to accept connection request');
        throw error;
      }
    },

    getConnections: async (): Promise<Connection[]> => {
      try {
        return api.get<Connection[]>(API_ENDPOINTS.GET_CONNECTIONS);
      } catch (error) {
        messageHandler.error('Failed to fetch connections');
        throw error;
      }
    },

    getConnectionRequests: async (): Promise<ConnectionRequest[]> => {
      try {
        return api.get<ConnectionRequest[]>(API_ENDPOINTS.GET_CONNECTION_REQUESTS);
      } catch (error) {
        messageHandler.error('Failed to fetch connection requests');
        throw error;
      }
    }
  }
};