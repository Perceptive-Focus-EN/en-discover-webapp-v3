// src/features/resources/types/filters.ts
import { ResourceMetadata } from './metadata';
import { ResourceStatus, ResourceVisibility } from './resources';

export interface ResourceFilters {
  category?: string[];
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
  status?: ResourceStatus;
  visibility?: ResourceVisibility;
  readingLevel?: ResourceMetadata['readingLevel'];
  tags?: string[];
}

export interface ResourceSortOptions {
  field: ResourceSortField;
  order: 'asc' | 'desc';
}

export type ResourceSortField =
  | 'datePublished'
  | 'rating'
  | 'readTime'
  | 'votes'
  | 'viewCount'
  | 'title'
  | 'lastModified';