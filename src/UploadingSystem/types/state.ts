import { BlockBlobClient } from '@azure/storage-blob';
import { ChunkStatus, FileCategory, AccessLevel, RetentionType } from '@/UploadingSystem/constants/uploadConstants';
import { BaseProgress } from './progress';

export interface ChunkState {
    id: number;
    start: number;
    end: number;
    size: number;
    status: ChunkStatus;
    attempts: number;
    etag?: string;
    error?: string;
}

export interface ControlState {
    userId: string;
    tenantId: string;
    isRunning: boolean;
    isPaused: boolean;
    isCancelled: boolean;
    isCompleted: boolean;
    isFailed: boolean;
    isRetrying: boolean;
    retryCount: number;
    lastRetryTimestamp: number;
    lastError?: string;
    locked?: boolean;
    leaseId?: string;
}

export interface UploadMetadata {
    userId: string; // Added userId property
    tenantId: string;
    trackingId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category: FileCategory;
    accessLevel: AccessLevel;
    retention: RetentionType;
    startTime: number;
    tempFilePath?: string;
}

export interface UploadState {
    userId: string;
    tenantId: string;
    chunks: Map<number, ChunkState>;
    control: ControlState;
    metadata: UploadMetadata;
    progress: BaseProgress;
    blockBlobClient: BlockBlobClient;
    blockIds: string[];
}