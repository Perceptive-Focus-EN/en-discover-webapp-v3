// src/features/posts/api/postApi.ts
import { clientApi } from '@/lib/api_s/client';
import { apiRequest } from '@/lib/api_s/client/utils';
import { Post, CreatePostDTO, UpdatePostDTO, PostResponse } from './types';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

// Handle FormData for media uploads
const createFormData = (data: CreatePostDTO | UpdatePostDTO): FormData | CreatePostDTO | UpdatePostDTO => {
    if (data.media) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'media' && value instanceof File) {
                    formData.append('media', value);
                } else {
                    formData.append(key, value as string);
                }
            }
        });
        return formData;
    }
    return data;
};

export const postApi = {
    /**
     * Create a new post
     */
    create: async (data: CreatePostDTO): Promise<Post> => {
        const formData = createFormData(data);
        const response = await apiRequest.post<PostResponse>('/api/posts', formData, {
            headers: {
                'Content-Type': data.media ? 'multipart/form-data' : 'application/json',
            },
        });
        messageHandler.success('Post created successfully');
        return response.data.data;
    },

    /**
     * Update an existing post
     */
    update: async (data: UpdatePostDTO): Promise<Post> => {
        const formData = createFormData(data);
        const response = await apiRequest.put<PostResponse>(`/api/posts/${data.id}`, formData, {
            headers: {
                'Content-Type': data.media ? 'multipart/form-data' : 'application/json',
            },
        });
        messageHandler.success('Post updated successfully');
        return response.data.data;
    },

    /**
     * Delete a post
     */
    delete: async (id: string): Promise<void> => {
        await apiRequest.delete(`/api/posts/${id}`);
        messageHandler.success('Post deleted successfully');
    },

    /**
     * Get a single post by ID
     */
    get: async (id: string): Promise<Post> => {
        const response = await apiRequest.get<{ data: Post }>(`/api/posts/${id}`);
        return response.data.data;
    },

    /**
     * List posts with pagination and filtering
     */
    list: async (params: PaginationParams = {}): Promise<PaginatedResponse<Post>> => {
        return clientApi.getPaginated<Post>('/api/posts', {
            page: params.page || 1,
            limit: params.limit || 20,
            sort: params.sort || { field: 'createdAt', order: 'desc' },
            filter: params.filter,
        });
    },

    /**
     * Get the next page of posts
     */
    getNextPage: async (
        currentResponse: PaginatedResponse<Post>,
        params: Omit<PaginationParams, 'page'> = {}
    ): Promise<PaginatedResponse<Post>> => {
        return clientApi.getNextPage<Post>('/api/posts', currentResponse, params);
    },

    /**
     * Get posts by user ID
     */
    getByUser: async (
        userId: string,
        params: PaginationParams = {}
    ): Promise<PaginatedResponse<Post>> => {
        return clientApi.getPaginated<Post>('/api/posts', {
            ...params,
            filter: {
                ...params.filter,
                userId
            }
        });
    },

    /**
     * Get posts by type
     */
    getByType: async (
        type: Post['type'],
        params: PaginationParams = {}
    ): Promise<PaginatedResponse<Post>> => {
        return clientApi.getPaginated<Post>('/api/posts', {
            ...params,
            filter: {
                ...params.filter,
                type
            }
        });
    },

    /**
     * Get draft posts
     */
    getDrafts: async (
        params: PaginationParams = {}
    ): Promise<PaginatedResponse<Post>> => {
        return clientApi.getPaginated<Post>('/api/posts/drafts', {
            ...params,
            filter: {
                ...params.filter,
                status: 'draft'
            }
        });
    },

    /**
     * Auto-save draft
     */
    autoSaveDraft: async (data: Partial<CreatePostDTO>): Promise<Post> => {
        const response = await apiRequest.post<{ data: Post }>(
            '/api/posts/drafts',
            {
                ...data,
                status: 'draft'
            }
        );
        return response.data.data;
    },

    /**
     * Get trending posts
     */
    getTrending: async (
        params: PaginationParams = {}
    ): Promise<PaginatedResponse<Post>> => {
        return clientApi.getPaginated<Post>('/api/posts/trending', {
            ...params,
            sort: { field: 'engagement', order: 'desc' }
        });
    },

    /**
     * Get posts for user feed
     */
    getFeed: async (
        params: PaginationParams = {}
    ): Promise<PaginatedResponse<Post>> => {
        return clientApi.getPaginated<Post>('/api/posts/feed', params);
    },

    /**
     * Report a post
     */
    report: async (postId: string, reason: string): Promise<void> => {
        await apiRequest.post(`/api/posts/${postId}/report`, { reason });
    },

    /**
     * Share a post
     */
    share: async (postId: string, platform: string): Promise<void> => {
        await apiRequest.post(`/api/posts/${postId}/share`, { platform });
    }
};

// Add type exports for better type safety
export type { Post, CreatePostDTO, UpdatePostDTO };
export type PostType = Post['type'];
export type PostStatus = 'draft' | 'published' | 'archived' | 'deleted';
export type { PaginationParams, PaginatedResponse };
