// src/lib/api/uploads.ts

import { api } from '../../axiosSetup';
import { 
    FileCategory, 
    ProcessingStep, 
    UploadStatus,
    AccessLevel,
    RetentionType 
} from '@/constants/uploadConstants';

// Add ProcessingMetadata interface
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
        category: FileCategory;
        accessLevel: AccessLevel;
        retention: RetentionType;
        processingSteps: ProcessingStep[];
        duration: number;
    };
    processing?: ProcessingMetadata;
}


export interface UploadErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    trackingId?: string;
    lastSuccessfulChunk?: number;
    uploadedBytes?: number;
    canResume?: boolean;
}


interface UploadProgressCallback {
    (progress: number): void;
}

export const uploadApi = {
    // Upload a new file
    uploadFile: async (
        file: File,
        category: FileCategory,
        onProgress?: UploadProgressCallback
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        interface UploadProgressEvent {
            loaded: number;
            total?: number;
        }

        interface UploadPostConfig {
            headers: {
                'Content-Type': string;
            };
            onUploadProgress: (progressEvent: UploadProgressEvent) => void;
        }

        const uploadPostConfig: UploadPostConfig = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent: UploadProgressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            },
        };

        return api.post<UploadResponse>(
            `/api/uploads/enhancedSecurityUpload?type=${category}`,
            formData,
            uploadPostConfig
        );
    },

    // Resume an interrupted upload
    resumeUpload: async (
        file: File,
        trackingId: string,
        lastSuccessfulChunk: number,
        category: FileCategory,
        onProgress?: UploadProgressCallback
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('trackingId', trackingId);
        formData.append('resumeFrom', lastSuccessfulChunk.toString());

        return api.post<UploadResponse>(
            `/api/uploads/enhancedSecurityUpload/resume?type=${category}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent: ProgressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                },
            }
        );
    },

    // Get upload status
    getUploadStatus: async (trackingId: string): Promise<UploadResponse> => {
        return api.get<UploadResponse>(`/api/uploads/enhancedSecurityUpload/status/${trackingId}`);
    },

    // Cancel ongoing upload
    cancelUpload: async (trackingId: string): Promise<void> => {
        return api.delete(`/api/uploads/enhancedSecurityUpload/${trackingId}`);
    },

    // Get upload history
    getUploadHistory: async (page: number = 1, limit: number = 10) => {
        return api.get(`/api/uploads/enhancedSecurityUpload/history?page=${page}&limit=${limit}`);
    }
};