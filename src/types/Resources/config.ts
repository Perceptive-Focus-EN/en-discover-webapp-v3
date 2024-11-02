// src/features/resources/types/config.ts
import { ResourcePermissions } from './permissions';
import { ResourceFilters, ResourceSortOptions } from './filters';
import { Resource, ResourceFormData } from './resources';

export interface ResourceHookConfig {
  enableOptimisticUpdates?: boolean;
  autoRefreshInterval?: number;
  cacheTimeout?: number;
  retryAttempts?: number;
  permissions?: ResourcePermissions;
}

export interface ResourceCache {
  data: Resource[];
  timestamp: number;
  filters?: ResourceFilters;
  sort?: ResourceSortOptions;
}

export interface ResourceUpdatePayload {
  id: string;
  changes: Partial<ResourceFormData>;
  metadata?: {
    updateReason?: string;
    updateType?: 'minor' | 'major';
    notifySubscribers?: boolean;
  };
}

export interface ResourceBatchActionPayload {
  ids: string[];
  action: 'delete' | 'archive' | 'publish' | 'bookmark';
  metadata?: Record<string, any>;
}

export interface ResourceStatistics {
  viewsCount: number;
  uniqueViewers: number;
  averageRating: number;
  totalComments: number;
  engagementRate: number;
  bookmarkRate: number;
  shareRate: number;
}