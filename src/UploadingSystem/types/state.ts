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
    isPaused: boolean;
    isCancelled: boolean;
    retryCount: number;
    lastRetryTimestamp: number;
    locked?: boolean;
    leaseId?: string;
}

export interface UploadMetadata {
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
    chunks: Map<number, ChunkState>;
    control: ControlState;
    metadata: UploadMetadata;
    progress: BaseProgress;
    blockBlobClient: BlockBlobClient;
    blockIds: string[];
}