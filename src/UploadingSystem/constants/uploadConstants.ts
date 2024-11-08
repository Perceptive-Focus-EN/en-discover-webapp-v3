// src/constants/uploadConstants.ts

import formidable from 'formidable';
import { AZURE_BLOB_STORAGE_CONFIG } from '../../constants/azureConstants';

export const UPLOAD_STATUS = {
    INITIALIZING: 'initializing',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    RESUMING: 'resuming',
    COMPLETED: 'completed',
    FAILED: 'failed'
} as const;


export type UploadStatus = typeof UPLOAD_STATUS[keyof typeof UPLOAD_STATUS];

export const CHUNK_STATUS = {
    PENDING: 'pending',      // Waiting to start
    UPLOADING: 'uploading',  // Currently uploading
    COMPLETED: 'completed',  // Successfully uploaded
    FAILED: 'failed'        // Failed to upload
} as const;

export type ChunkStatus = typeof CHUNK_STATUS[keyof typeof CHUNK_STATUS];

export const UPLOAD_EVENTS = {
    PROGRESS: 'UPLOAD_PROGRESS',
    ERROR: 'UPLOAD_ERROR',
    COMPLETE: 'UPLOAD_COMPLETE',
    PAUSED: 'UPLOAD_PAUSED',
    RESUMED: 'UPLOAD_RESUMED',
    CLEANUP: 'UPLOAD_CLEANUP',
    RETRY: 'UPLOAD_RETRY',
    // Chunk-specific events
    CHUNK_COMPLETE: 'CHUNK_COMPLETE',
    CHUNK_ERROR: 'CHUNK_ERROR',
    CHUNK_RETRY: 'CHUNK_RETRY'
} as const;

export const UPLOAD_WEBSOCKET = {
    EVENTS: UPLOAD_EVENTS,  // Use the consolidated events
    RECONNECT: {
        MAX_ATTEMPTS: 5,
        INITIAL_DELAY: 1000,
        MAX_DELAY: 30000
    }
} as const;

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

export const COSMOS_COLLECTIONS = {
    FILE_TRACKING: 'FileTracking',
    UPLOAD_HISTORY: 'UploadHistory',
    UPLOADS: 'Uploads' // Add this
} as const;

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

export const CHUNKING_CONFIG = {
    CHUNK_SIZE: UPLOAD_SETTINGS.CHUNK_SIZE,
    MAX_RETRIES: UPLOAD_SETTINGS.MAX_RETRIES,
    RETRY_DELAY_BASE: UPLOAD_SETTINGS.RETRY_DELAY_BASE,
    MAX_CONCURRENT: UPLOAD_SETTINGS.MAX_CONCURRENT_UPLOADS
} as const;


// Types that map to API/DB
export const FileCategory = {
    DOCUMENT: 'document',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    OTHER: 'other',
} as const;

// Then derive the type from it
export type FileCategory = typeof FileCategory[keyof typeof FileCategory];


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
    audio: {
        category: 'audio',
        accessLevel: 'private',
        retention: 'permanent',
        contentType: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        maxSize: 50 * 1024 * 1024, // 50MB
        processingSteps: []
    },
    other: {
        category: 'other',
        accessLevel: 'private',
        retention: 'temporary',
        contentType: ['*/*'],
        maxSize: 50 * 1024 * 1024, // 50MB
        processingSteps: []
    }
} as const;
