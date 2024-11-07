// src/constants/uploadConstants.ts

import formidable from 'formidable';
import { AZURE_BLOB_STORAGE_CONFIG } from './azureConstants';

export type FileCategory = 'document' | 'image' | 'video' | 'temp';
export type RetentionType = 'temporary' | 'permanent';
export type AccessLevel = 'private' | 'shared' | 'public';
export type ProcessingStep = 'compress' | 'thumbnail' | 'scan' | 'encrypt';

export interface FileConfig {
  category: FileCategory;
  accessLevel: AccessLevel;
  retention: RetentionType;
  contentType: string[];
  maxSize: number;
  processingSteps: ProcessingStep[];
}

export const UPLOAD_WEBSOCKET = {
    EVENTS: {
        PROGRESS: 'UPLOAD_PROGRESS',
        ERROR: 'UPLOAD_ERROR',
        COMPLETE: 'UPLOAD_COMPLETE',
        PAUSED: 'UPLOAD_PAUSED',
        RESUMED: 'UPLOAD_RESUMED'
    },
    RECONNECT: {
        MAX_ATTEMPTS: 5,
        INITIAL_DELAY: 1000,
        MAX_DELAY: 30000
    }
} as const;

export const UPLOAD_CONFIGS: Record<FileCategory, FileConfig> = {
  document: {
    category: 'document',
    accessLevel: 'private',
    retention: 'permanent',
    contentType: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    processingSteps: ['scan', 'encrypt']
  },
  image: {
    category: 'image',
    accessLevel: 'shared',
    retention: 'permanent',
    contentType: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    processingSteps: ['compress', 'thumbnail']
  },
  video: {
    category: 'video',
    accessLevel: 'private',
    retention: 'permanent',
    contentType: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    maxSize: 500 * 1024 * 1024, // 500MB
    processingSteps: ['compress', 'thumbnail']
  },
  temp: {
    category: 'temp',
    accessLevel: 'private',
    retention: 'temporary',
    contentType: ['*/*'],
    maxSize: 100 * 1024 * 1024, // 100MB
    processingSteps: []
  }
} as const;

// src/constants/uploadConstants.ts
export const UPLOAD_SETTINGS = {
    CHUNK_SIZE: 8 * 1024 * 1024, // 8MB chunks
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE: 1000, // Base delay in milliseconds
    MAX_CONCURRENT_UPLOADS: 3,
    DEFAULT_CATEGORY: 'document' as FileCategory,
    // Add form settings
    FORM: {
        UPLOAD_DIR: '/tmp',
        KEEP_EXTENSIONS: true,
        TIMEOUT: 30 * 60 * 1000, // 30 minutes
        FILE_NAME_LENGTH: 100,
        HASH_ALGORITHM: 'sha256',
        MULTIPLES: false
    },
    // Add response settings
    RESPONSE: {
        MAX_SIZE: '50mb',
        TIMEOUT: 30 * 60 * 1000 // 30 minutes
    }
} as const;


export const UPLOAD_PATHS = {
  BASE_PATH: `${AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME}.blob.core.windows.net`,
  CONTAINER: AZURE_BLOB_STORAGE_CONFIG.CONTAINER_NAME,
  generateBlobPath: (params: {
    tenantId: string;
    category: FileCategory;
    userId: string;
    trackingId: string;
    fileName: string;
  }) => {
    return `${params.tenantId}/${params.category}/${params.userId}/${params.trackingId}/${params.fileName}`;
  }
};
// Update COSMOS_COLLECTIONS

export const COSMOS_COLLECTIONS = {
    FILE_TRACKING: 'FileTracking',
    UPLOAD_HISTORY: 'UploadHistory',
    UPLOADS: 'Uploads' // Add this

} as const;

// Extend UPLOAD_STATUS
export const UPLOAD_STATUS = {
    INITIALIZING: 'initializing',
    PROCESSING: 'processing',
    COMPLETE: 'complete',
    ERROR: 'error',
    PAUSED: 'paused',
    RESUMING: 'resuming'
} as const;


// Add upload tracking interfaces
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


// Add collection schema information
export const COLLECTIONS_SCHEMA = {
    UPLOADS: {
        indexes: [
            { key: { trackingId: 1 }, unique: true },
            { key: { status: 1 } },
            { key: { userId: 1 } },
            { key: { tenantId: 1 } },
            { key: { lastModified: 1 } },
            { key: { category: 1 } }
        ],
        required: ['id', 'userId', 'tenantId', 'status']
    }
} as const;


export type UploadStatus = typeof UPLOAD_STATUS[keyof typeof UPLOAD_STATUS];

export interface UploadFormData {
    file: formidable.File;
    [key: string]: any;
}

export interface ChunkingOptions {
    chunkSize: number;
    maxRetries: number;
    retryDelayBase: number;
    maxConcurrent: number;
    resumeFromChunk?: number;
}

export interface UploadOptions {
    onProgress: (progress: number, chunkIndex: number, totalChunks: number, uploadedBytes: number) => void;
    userId: string;
    trackingId: string;
    fileSize: number;
}

// Add chunking configuration
export const CHUNKING_CONFIG = {
    CHUNK_SIZE: UPLOAD_SETTINGS.CHUNK_SIZE,
    MAX_RETRIES: UPLOAD_SETTINGS.MAX_RETRIES,
    RETRY_DELAY_BASE: UPLOAD_SETTINGS.RETRY_DELAY_BASE,
    MAX_CONCURRENT: UPLOAD_SETTINGS.MAX_CONCURRENT_UPLOADS,
    STATES: {
        PENDING: 'pending',
        UPLOADING: 'uploading',
        COMPLETED: 'completed',
        FAILED: 'failed',
        PAUSED: 'paused'
    },
    EVENTS: {
        CHUNK_COMPLETE: 'chunkComplete',
        CHUNK_ERROR: 'chunkError',
        CHUNK_RETRY: 'chunkRetry',
        UPLOAD_PROGRESS: 'uploadProgress'
    }
} as const;