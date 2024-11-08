// src/lib/api/uploads/index.ts

import { api } from '../../axiosSetup';
import { 
    FileCategory, 
    ProcessingStep, 
    UploadStatus,
    AccessLevel,
    RetentionType,
    UPLOAD_STATUS,
    CHUNKING_CONFIG 
} from '@/UploadingSystem/constants/uploadConstants';

// Types remain the same as they're correct
export interface ProcessingMetadata {
    status: UploadStatus;
    completedSteps: ProcessingStep[];
    currentStep?: ProcessingStep;
    error?: string;
}

export interface UploadResponse {
    message: string;
    trackingId: string;
    fileUrl: string;
    status: UploadStatus;
    metadata: {
        originalName: string;
        mimeType: string;
        uploadedAt: string;
        fileSize: number;
        category: FileCategory;
        accessLevel: AccessLevel;
        retention: RetentionType;
        processingSteps: ProcessingStep[];
        duration: number;
    };
    processing?: ProcessingMetadata;
}

export interface UploadProgressInfo {
    loaded: number;
    total: number;
    percentage: number;
    speed?: number;
    remainingTime?: number;
    currentChunk?: number;
    totalChunks?: number;
}

export const uploadApi = {
    /**
     * Upload a file with progress tracking
     * Handles both full file and chunked uploads internally
     */
    uploadFile: async (
        file: File,
        category: FileCategory,
        onProgress?: (info: UploadProgressInfo) => void
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const totalChunks = Math.ceil(file.size / CHUNKING_CONFIG.CHUNK_SIZE);
        const startTime = performance.now();

        return api.post<UploadResponse>(
            `/api/uploads/enhancedSecurityUpload?type=${category}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent: ProgressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const currentChunk = Math.floor(
                            (progressEvent.loaded / progressEvent.total) * totalChunks
                        );

                        onProgress({
                            loaded: progressEvent.loaded,
                            total: progressEvent.total,
                            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
                            currentChunk,
                            totalChunks,
                            speed: calculateSpeed(progressEvent.loaded, startTime),
                            remainingTime: calculateRemainingTime(
                                progressEvent.loaded,
                                progressEvent.total,
                                startTime
                            ),
                        });
                    }
                },
            }
        );
    },

    /**
     * Resume an interrupted upload
     */
    resumeUpload: async (
        file: File,
        trackingId: string,
        lastChunk: number,
        category: FileCategory,
        onProgress?: (info: UploadProgressInfo) => void
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('resumeFrom', lastChunk.toString());

        const totalChunks = Math.ceil(file.size / CHUNKING_CONFIG.CHUNK_SIZE);
        const startTime = performance.now();

        return api.post<UploadResponse>(
            `/api/uploads/enhancedSecurityUpload?type=${category}&resumeFrom=${lastChunk}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent: ProgressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const currentChunk = Math.floor(
                            (progressEvent.loaded / progressEvent.total) * totalChunks
                        ) + lastChunk;

                        onProgress({
                            loaded: progressEvent.loaded + (lastChunk * CHUNKING_CONFIG.CHUNK_SIZE),
                            total: progressEvent.total,
                            percentage: Math.round(
                                ((progressEvent.loaded + (lastChunk * CHUNKING_CONFIG.CHUNK_SIZE)) * 100) / 
                                file.size
                            ),
                            currentChunk,
                            totalChunks,
                            speed: calculateSpeed(progressEvent.loaded, startTime),
                            remainingTime: calculateRemainingTime(
                                progressEvent.loaded,
                                progressEvent.total,
                                startTime
                            ),
                        });
                    }
                },
            }
        );
    },

    /**
     * Get upload status
     */
    getUploadStatus: async (trackingId: string): Promise<UploadResponse> => {
        return api.get<UploadResponse>(`/api/uploads/enhancedSecurityUpload/status/${trackingId}`);
    },

    /**
     * Cancel ongoing upload
     */
    cancelUpload: async (trackingId: string): Promise<void> => {
        await api.delete(`/api/uploads/enhancedSecurityUpload/${trackingId}`);
    },

    /**
     * Get upload history with pagination
     */
    getUploadHistory: async (
        page: number = 1,
        limit: number = 10,
        filter?: {
            status?: UploadStatus;
            category?: FileCategory;
        }
    ): Promise<{
        items: UploadResponse[];
        totalItems: number;
        currentPage: number;
        totalPages: number;
    }> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(filter?.status && { status: filter.status }),
            ...(filter?.category && { category: filter.category }),
        });

        return api.get(`/api/uploads/enhancedSecurityUpload/history?${params}`);
    },
};

// Utility functions remain the same as they're still needed
const calculateSpeed = (loaded: number, startTime: number): number => {
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    return elapsedSeconds > 0 ? loaded / elapsedSeconds : 0;
};

const calculateRemainingTime = (loaded: number, total: number, startTime: number): number => {
    const elapsedTime = (performance.now() - startTime) / 1000;
    const speed = loaded / elapsedTime;
    return speed > 0 ? (total - loaded) / speed : 0;
};

export type { FileCategory, UploadStatus, ProcessingStep, AccessLevel, RetentionType };
export { UPLOAD_STATUS };