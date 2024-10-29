// src/features/posts/api/draftApi.ts
import { clientApi } from '@/lib/api_s/client';
import { apiRequest } from '@/lib/api_s/client/utils';
import { Post, CreatePostDTO, Draft, DraftResponse } from './types';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';

export const draftApi = {
  /**
   * Save or update a draft
   */
  save: async (data: CreatePostDTO): Promise<Draft> => {
    const response = await apiRequest.post<DraftResponse>('/api/drafts', {
      ...data,
      status: 'draft'
    });
    return response.data.data; // Access the draft from the response
  },

  /**
   * Get a specific draft by ID
   */
  get: async (draftId: string): Promise<Draft> => {
    const response = await apiRequest.get<DraftResponse>(`/api/drafts/${draftId}`);
    return response.data.data; // Access the draft from the response
  },

  /**
   * List all drafts with pagination
   */
  list: async (params: PaginationParams = {}): Promise<PaginatedResponse<Draft>> => {
    return clientApi.getPaginated<Draft>('/api/drafts', {
      ...params,
      sort: params.sort || { field: 'updatedAt', order: 'desc' }
    });
  },

  /**
   * Delete a draft
   */
  delete: async (draftId: string): Promise<void> => {
    await apiRequest.delete(`/api/drafts/${draftId}`);
  },

  /**
   * Auto-save draft
   */
  autoSave: async (data: Partial<CreatePostDTO> & { draftId: string }): Promise<Draft> => {
    const response = await apiRequest.put<DraftResponse>(
      `/api/drafts/${data.draftId}/auto-save`,
      data
    );
    return response.data.data; // Access the draft from the response
  },

  /**
   * Publish a draft
   */
  publish: async (draftId: string): Promise<Post> => {
    const response = await apiRequest.put<{ data: Post; message?: string }>(
      `/api/drafts/${draftId}/publish`,
      { status: 'published' }
    );
    return response.data.data; // Access the post from the response
  },

  /**
   * Revert to draft
   */
  revertToLastSaved: async (draftId: string): Promise<Draft> => {
    const response = await apiRequest.put<DraftResponse>(
      `/api/drafts/${draftId}/revert`
    );
    return response.data.data; // Access the draft from the response
  }
};