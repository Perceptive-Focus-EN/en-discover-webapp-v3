import { useState, useCallback } from 'react';
import { uploadApi } from '@/lib/api/uploads';
import { 
    FileCategory, 
    UPLOAD_CONFIGS,
    UPLOAD_STATUS,
    ProcessingStep,
    type UploadStatus 
} from '@/constants/uploadConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { UploadResponse } from '@/lib/api/uploads';

interface UseArticleMediaReturn {
    uploadMedia: (file: File, category: FileCategory) => Promise<UploadResponse>;
    progress: number;
    error: string | null;
    isUploading: boolean;
    status: UploadStatus;
    processingStatus: ProcessingStep | null;
    cancelUpload: typeof uploadApi.cancelUpload;
}

export function useArticleMedia(): UseArticleMediaReturn {
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<UploadStatus>(UPLOAD_STATUS.INITIALIZING);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStep | null>(null);

    const validateFile = useCallback((file: File, category: FileCategory): void => {
        const config = UPLOAD_CONFIGS[category];
        
        if (!config.contentType.includes(file.type) && config.contentType[0] !== '*/*') {
            throw new Error(
                `Invalid file type. Allowed types: ${config.contentType.join(', ')}`
            );
        }

        if (file.size > config.maxSize) {
            const maxSizeMB = config.maxSize / (1024 * 1024);
            throw new Error(
                `File size exceeds limit of ${maxSizeMB}MB`
            );
        }
    }, []);

    const uploadMedia = useCallback(async (
        file: File, 
        category: FileCategory
    ): Promise<UploadResponse> => {
        let pollInterval: NodeJS.Timeout | null = null;
        const startTime = Date.now();

        try {
            validateFile(file, category);
            setIsUploading(true);
            setError(null);
            setStatus(UPLOAD_STATUS.INITIALIZING);

            const response = await uploadApi.uploadFile(
                file,
                category,
                (progress: number) => {
                    setProgress(Math.min(progress * 100, 99));
                }
            );

            setStatus(response.status);
            setProgress(100);

            // Start monitoring processing steps if needed
            if (response.processing?.currentStep) {
                setProcessingStatus(response.processing.currentStep);
                
                if (response.status === UPLOAD_STATUS.PROCESSING) {
                    pollInterval = setInterval(async () => {
                        try {
                            const status = await uploadApi.getUploadStatus(response.trackingId);
                            
                            if (status.status === UPLOAD_STATUS.COMPLETE || 
                                status.status === UPLOAD_STATUS.ERROR) {
                                if (pollInterval) {
                                    clearInterval(pollInterval);
                                }
                                setStatus(status.status);
                            }

                            if (status.processing?.currentStep) {
                                setProcessingStatus(status.processing.currentStep);
                            }
                        } catch (error) {
                            console.error('Failed to get processing status:', error);
                            if (pollInterval) clearInterval(pollInterval);
                        }
                    }, 5000);
                }
            }

            // Record success metric
            monitoringManager.metrics.recordMetric(
                MetricCategory.BUSINESS,
                'article_media',
                'upload_success',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                {
                    category,
                    fileType: file.type,
                    fileSize: file.size,
                    processingSteps: response.metadata.processingSteps,
                    duration: Date.now() - startTime
                }
            );

            return response;

        } catch (error) {
            setStatus(UPLOAD_STATUS.ERROR);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setError(errorMessage);

            // Record failure metric
            monitoringManager.metrics.recordMetric(
                MetricCategory.BUSINESS,
                'article_media',
                'upload_failure',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                {
                    category,
                    error: errorMessage,
                    fileType: file.type,
                    fileSize: file.size,
                    duration: Date.now() - startTime
                }
            );

            throw error;
        } finally {
            if (!isUploading) {
                setProgress(0);
                setIsUploading(false);
            }
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        }
    }, [validateFile]);

    return {
        uploadMedia,
        progress,
        error,
        isUploading,
        status,
        processingStatus,
        cancelUpload: uploadApi.cancelUpload
    };
}