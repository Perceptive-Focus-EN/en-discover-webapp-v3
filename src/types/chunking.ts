import { BlockBlobClient } from '@azure/storage-blob';
import { DashboardMetrics } from '@/MonitoringSystem/managers/MonitoringManager';
import { ChunkStatus, UploadStatus } from '../constants/uploadConstants';
import { UploadProgress } from './upload';

// Core Chunking Types
export interface ChunkingOptions {
    chunkSize: number;
    maxRetries: number;
    retryDelayBase: number;
    maxConcurrent: number;
    resumeFromChunk?: number;
}

export interface ChunkConfig {
    chunkSize: number;
    maxRetries: number;
    retryDelayBase: number;
    maxConcurrent: number;
}

export interface ChunkMetadata {
    id: number;
    start: number;
    end: number;
    size: number;
    etag?: string;
    attempts: number;
}

export interface ChunkProgress {
    chunkId: string;
    progress: number;
    status: ChunkStatus;  // Uses the dedicated chunk status type
    error?: string;
}

export interface ChunkUploadResult {
    chunkId: number;
    blockId: string;
    attempts: number;
    duration: number;
    success: boolean;
    error?: Error;
}

// Progress and State Types
export interface UploadState {
    completedChunks: Set<number>;
    lastSuccessfulChunk: number;
    uploadedBytes: number;
    blockIds: string[];
    locked?: boolean;
    leaseId?: string;
    blockBlobClient: BlockBlobClient;
    startTime: number;
    tempFilePath?: string;
    totalBytes: number;
}

export interface UploadProgressEvent extends UploadProgress {
    userId: string;
}

export interface EnhancedProgress extends UploadProgressEvent {
    estimatedTimeRemaining: number;
    uploadSpeed: number;
    serverLoad: number;
}

// Metadata Types
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

// Metrics and Cache Types
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

export interface CacheOptions {
    max: number;
    ttl: number;
    updateAgeOnGet: boolean;
    updateAgeOnHas: boolean;
}
