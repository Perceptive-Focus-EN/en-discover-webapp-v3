// src/features/posts/api/commentApi.ts
import { clientApi } from '@/lib/api_s/client';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;  // For nested comments
  replyCount: number;
  isEdited: boolean;
  author: {
    name: string;
    avatar?: string;
  };
}

export interface CreateCommentDTO {
  content: string;
  parentId?: string;
}

export const commentApi = {
  create: async (postId: string, data: CreateCommentDTO): Promise<Comment> => {
    const response = await clientApi.post<Comment>(
      `/posts/${postId}/comments`,
      data
    );
    return response.data;
  },

  list: async (postId: string, page = 1): Promise<{ 
    comments: Comment[];
    hasMore: boolean;
  }> => {
    const response = await clientApi.get<{ 
      comments: Comment[];
      hasMore: boolean;
    }>(`/posts/${postId}/comments?page=${page}`);
    return response.data;
  },

  update: async (
    postId: string,
    commentId: string,
    content: string
  ): Promise<Comment> => {
    const response = await clientApi.put<Comment>(
      `/posts/${postId}/comments/${commentId}`,
      { content }
    );
    return response.data;
  },

  delete: async (postId: string, commentId: string): Promise<void> => {
    await clientApi.delete(`/posts/${postId}/comments/${commentId}`);
  },

  getReplies: async (
    postId: string,
    commentId: string,
    page = 1
  ): Promise<{
    replies: Comment[];
    hasMore: boolean;
  }> => {
    const response = await clientApi.get<{
      replies: Comment[];
      hasMore: boolean;
    }>(`/posts/${postId}/comments/${commentId}/replies?page=${page}`);
    return response.data;
  }
};