import { UploadStatus } from '@/UploadingSystem/constants/uploadConstants';

// Base progress interface
export interface BaseProgress {
    userId: string;
    tenantId: string;
    trackingId: string;
    progress: number;
    chunksCompleted: number;
    totalChunks: number;
    uploadedBytes: number;
    totalBytes: number;
    status: UploadStatus;
    error?: string;
}

// Standard upload progress
export interface UploadProgress extends BaseProgress {
    timestamp: number;
}

// Enhanced progress with metrics
export interface EnhancedProgress extends UploadProgress {
    estimatedTimeRemaining: number;
    uploadSpeed: number;
    serverLoad: number;
    timestamp: number;
}

// WebSocket specific progress
export interface SocketIOProgress extends EnhancedProgress {
    timestamp: number;
    connectionId?: string;
}

