// src/types/upload.ts
import { CHUNKING_CONFIG, UPLOAD_WEBSOCKET } from '../constants/uploadConstants';
import { EnhancedProgress } from '@/services/ChunkingService';

export type UploadProgressStatus = typeof CHUNKING_CONFIG.STATES[keyof typeof CHUNKING_CONFIG.STATES];
export type UploadWebSocketEvent = typeof UPLOAD_WEBSOCKET.EVENTS[keyof typeof UPLOAD_WEBSOCKET.EVENTS];

// Update to use EnhancedProgress
export interface UploadProgressData extends EnhancedProgress {
    // Additional fields if needed
}

export interface WebSocketMessage {
    type: UploadWebSocketEvent;
    data: UploadProgressData;
}