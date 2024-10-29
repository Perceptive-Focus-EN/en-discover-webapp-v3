// src/types/pagination.ts
import { Post as DetailedPost } from '../feature/posts/api/types';

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: {
    field: string;
    order: 'asc' | 'desc'
  };
  filter?: Record<string, any>;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Remove the simplified Post interface and use the detailed one
export type { DetailedPost as Post };