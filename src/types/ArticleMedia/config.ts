// src/features/resources/types/config.ts
import { ResourceFilters, ResourceSortOptions } from './filters';
import { ResourcePermissions } from './permissions';
import { 
    Resource, 
} from './resources';
import { 
    FileCategory,
    ProcessingStep,
    UploadStatus 
} from '@/UploadingSystem/constants/uploadConstants';
import { ResourceFormData } from './form';


// Hook Configuration
export interface ResourceHookConfig {
    enableOptimisticUpdates?: boolean;
    autoRefreshInterval?: number;
    cacheTimeout?: number;
    retryAttempts?: number;
    permissions?: ResourcePermissions;
    uploadConfig?: {
        maxConcurrentUploads: number;
        chunkSize: number;
        maxRetries: number;
        allowedTypes: FileCategory[];
        processingSteps: ProcessingStep[];
    };
}

// Cache Management
export interface ResourceCache {
    data: Resource[];
    timestamp: number;
    filters?: ResourceFilters;
    sort?: ResourceSortOptions;
}

// Update Operations
export interface ResourceUpdatePayload {
    id: string;
    changes: Partial<ResourceFormData>;
    metadata?: {
        processingStatus?: UploadStatus;
        processingSteps?: ProcessingStep[];
        updateReason?: string;
        updateType?: 'minor' | 'major';
        notifySubscribers?: boolean;
    };
}

// Batch Operations
export interface ResourceBatchActionPayload {
    ids: string[];
    action: 'delete' | 'archive' | 'publish' | 'bookmark';
    metadata?: {
        processingStatus?: UploadStatus;
        processingSteps?: ProcessingStep[];
        [key: string]: any;
    };
}

// Statistics
export interface ResourceStatistics {
    viewsCount: number;
    uniqueViewers: number;
    averageRating: number;
    totalComments: number;
    engagementRate: number;
    bookmarkRate: number;
    shareRate: number;
    uploadStats?: {
        totalUploads: number;
        failedUploads: number;
        processingCount: number;
        averageUploadTime: number;
        averageProcessingTime: number;
    };
}




