// src/types/upload.ts
import formidable from 'formidable';
import { AccessLevel, FileCategory, ProcessingStep, RetentionType, UPLOAD_WEBSOCKET, UploadStatus } from '../constants/uploadConstants';
import { EnhancedProgress } from './chunking';

export interface UploadProgressData extends EnhancedProgress {
    // Additional fields if needed
}
export interface UploadProgress {
    trackingId: string;
    progress: number;
    chunksCompleted: number;
    totalChunks: number;
    uploadedBytes: number;
    totalBytes: number;
    status: UploadStatus;
    error?: string;
}

export interface UploadStatusDetails {
    completedAt?: Date;
    fileUrl?: string;
    duration?: number;
    processingSteps?: string[];
    error?: string;
    lastSuccessfulChunk?: number;
    uploadedBytes?: number;
}

export interface UploadSuccessResponse {
    message: string;
    trackingId: string;
    fileUrl: string;
    status: UploadStatus;
    metadata: {
        category: FileCategory;
        accessLevel: AccessLevel;
        retention: RetentionType;
        processingSteps: ProcessingStep[];
        duration: number;
    };
}

export interface UploadErrorResponse {
    error: string;
    message: string;
    reference?: string;
    trackingId?: string;
    canResume?: boolean;
    retryCount?: number;
}

export interface UploadDocument {
    id: string;
    userId: string;
    tenantId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category: FileCategory;
    status: UploadStatus;
    uploadStartTime: Date;
    lastModified: Date;
    fileUrl?: string;
    duration?: number;
    processingSteps?: ProcessingStep[];
    error?: string;
    completedAt?: Date;
    lastSuccessfulChunk?: number;
    uploadedBytes?: number;
    metadata?: {
        accessLevel: AccessLevel;
        retention: RetentionType;
        [key: string]: any;
    };
}

export interface UploadFormData {
    file: formidable.File;
    [key: string]: any;
}

export interface UploadOptions {
    onProgress: (progress: number, chunkIndex: number, totalChunks: number, uploadedBytes: number) => void;
    userId: string;
    trackingId: string;
    fileSize: number;
}
