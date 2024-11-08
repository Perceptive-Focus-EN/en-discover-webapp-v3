import { UploadStatus } from '@/UploadingSystem/constants/uploadConstants';

// Base progress interface
export interface BaseProgress {
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
    userId: string;
}

// Enhanced progress with metrics
export interface EnhancedProgress extends UploadProgress {
    estimatedTimeRemaining: number;
    uploadSpeed: number;
    serverLoad: number;
    timestamp: number;
}

// WebSocket specific progress
export interface WebSocketProgress extends EnhancedProgress {
    timestamp: number;
    connectionId?: string;
}