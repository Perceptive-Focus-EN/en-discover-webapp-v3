import { DashboardMetrics } from '@/MonitoringSystem/managers/MonitoringManager';
import { ChunkState, UploadState } from './state';
import { ChunkStatus } from '../constants/uploadConstants';

// Configuration interfaces
export interface ChunkingOptions {
    chunkSize: number;
    maxRetries: number;
    retryDelayBase: number;
    maxConcurrent: number;
    resumeFromChunk?: number;
}

// Operation results
export interface ChunkUploadResult {
    chunkId: number;
    blockId: string;
    attempts: number;
    duration: number;
    success: boolean;
    error?: Error;
}

// Add to types/chunking.ts
export interface ChunkProgress {
    chunkId: string;
    progress: number;
    status: ChunkStatus;
    error?: string;
}

// Metadata for operations
export interface RetryMetadata {
    chunkId: number;
    attempt: number;
    total: number;
    lastError?: string;
    timestamp: number;
}

export interface UploadCleanupMetadata {
    trackingId: string;
    reason: 'failure' | 'completion' | 'cancellation';
    error?: Error;
    finalState?: UploadState;
}

// Metrics
export interface UploadMetrics extends DashboardMetrics {
    metadata: {
        component: 'upload_system';
        category: 'file_processing';
        aggregationType: 'latest';
        uploadStats: {
            activeUploads: number;
            queueSize: number;
            memoryUsage: number;
            chunkProgress: number;
        };
    };
}