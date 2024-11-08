import formidable from 'formidable';
import { FileCategory, ProcessingStep, AccessLevel, RetentionType, UploadStatus } from '@/UploadingSystem/constants/uploadConstants';
import { BaseProgress } from './progress';


export type UploadStatusDetails = Pick<UploadDocument, 
    'completedAt' | 
    'fileUrl' | 
    'duration' | 
    'processingSteps' | 
    'error' | 
    'lastSuccessfulChunk' | 
    'uploadedBytes'
    >;

// API Response interfaces
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

// Document interface for database
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

// Form handling interfaces
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