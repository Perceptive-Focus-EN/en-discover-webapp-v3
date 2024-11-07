// src/components/Resources/api/resourcesApi.ts
import { apiRequest } from '@/lib/api/client/utils';
import { clientApi } from '@/lib/api/client';
import {
  Resource,
  ResourceFormData,
  ResourceFilters,
  ResourceSortOptions,
  ResourceInteractions,
  ResourceMetadata,
} from '../../../types/ArticleMedia';
import { ResourceStatus, ResourceVisibility } from '../../../types/ArticleMedia/resources';

interface ResourceApiResponse<T> {
  data: T;
}

interface CreateResourcePayload extends ResourceFormData {
  status?: ResourceStatus;
}

interface UpdateResourcePayload extends Partial<ResourceFormData> {
  id: string;
  status?: ResourceStatus;
  metadata?: ResourceMetadata | undefined;
}

interface BookmarkResponse {
  bookmarked: boolean;
  bookmarkCount: number;
}

interface RatingResponse {
  rating: number;
  votes: number;
  userRating: number;
}

const RESOURCES_BASE_URL = '/api/resources';

export const resourcesApi = {
  async getResources(
    page = 1,
    limit = 10,
    filters?: ResourceFilters,
    sort?: ResourceSortOptions
  ) {
    try {
      return await clientApi.getPaginated<Resource>(RESOURCES_BASE_URL, {
        page,
        limit,
        filter: filters,
      });
    } catch (error) {
      throw error;
    }
  },

  async getResourceById(id: string): Promise<ResourceApiResponse<Resource>> {
    try {
      const response = await apiRequest.get<ResourceApiResponse<Resource>>(
        `${RESOURCES_BASE_URL}/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createResource(
    data: CreateResourcePayload
  ): Promise<ResourceApiResponse<Resource>> {
    try {
      const response = await apiRequest.post<ResourceApiResponse<Resource>>(
        RESOURCES_BASE_URL,
        {
          ...data,
          status: data.status || 'draft',
          datePublished: new Date().toISOString()
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateResource(
    data: UpdateResourcePayload
  ): Promise<ResourceApiResponse<Resource>> {
    try {
      const response = await apiRequest.put<ResourceApiResponse<Resource>>(
        `${RESOURCES_BASE_URL}/${data.id}`,
        {
          ...data,
          metadata: {
            ...data.metadata,
            lastModified: new Date().toISOString()
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteResource(id: string): Promise<void> {
    try {
      await apiRequest.delete(`${RESOURCES_BASE_URL}/${id}`);
    } catch (error) {
      throw error;
    }
  },

  async bookmarkResource(id: string): Promise<BookmarkResponse> {
    try {
      const response = await apiRequest.post<ResourceApiResponse<BookmarkResponse>>(
        `${RESOURCES_BASE_URL}/${id}/bookmark`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async rateResource(id: string, rating: number): Promise<RatingResponse> {
    try {
      const response = await apiRequest.post<ResourceApiResponse<RatingResponse>>(
        `${RESOURCES_BASE_URL}/${id}/rate`,
        { rating }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async getRelatedResources(
    id: string,
    limit = 5
  ): Promise<ResourceApiResponse<Resource[]>> {
    try {
      const response = await apiRequest.get<ResourceApiResponse<Resource[]>>(
        `${RESOURCES_BASE_URL}/${id}/related`,
        { limit }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const response = await apiRequest.get<ResourceApiResponse<string[]>>(
        `${RESOURCES_BASE_URL}/categories`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async searchResources(query: string, page = 1, limit = 10) {
    try {
      return await clientApi.getPaginated<Resource>(
        `${RESOURCES_BASE_URL}/search`,
        {
          page,
          limit,
          filter: { searchTerm: query }
        }
      );
    } catch (error) {
      throw error;
    }
  },

  async updateResourceStatus(
    id: string,
    status: ResourceStatus
  ): Promise<ResourceApiResponse<Resource>> {
    try {
      const response = await apiRequest.put<ResourceApiResponse<Resource>>(
        `${RESOURCES_BASE_URL}/${id}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateResourceVisibility(
    id: string,
    visibility: ResourceVisibility
  ): Promise<ResourceApiResponse<Resource>> {
    try {
      const response = await apiRequest.put<ResourceApiResponse<Resource>>(
        `${RESOURCES_BASE_URL}/${id}/visibility`,
        { visibility }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default resourcesApi;