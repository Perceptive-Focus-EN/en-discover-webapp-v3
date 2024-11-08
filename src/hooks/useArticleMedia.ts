// src/hooks/useUploadMedia.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { uploadApi, UploadResponse, UploadProgressInfo } from '@/lib/api/uploads';
import { 
    FileCategory, 
    UPLOAD_CONFIGS,
    UPLOAD_STATUS,
    ProcessingStep,
    type UploadStatus 
} from '@/UploadingSystem/constants/uploadConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface UseUploadMediaReturn {
    uploadMedia: (file: File, category: FileCategory) => Promise<UploadResponse>;
    resumeUpload: (file: File, trackingId: string, lastChunk: number, category: FileCategory) => Promise<UploadResponse>;
    cancelUpload: (trackingId: string) => Promise<void>;
    resetUpload: () => void;
    progress: number;
    error: string | null;
    isUploading: boolean;
    isProcessing: boolean;
    status: UploadStatus;
    processingStatus: ProcessingStep | null;
    currentChunk?: number;
    totalChunks?: number;
    uploadSpeed?: number;
    timeRemaining?: number;
}

export function useUploadMedia(): UseUploadMediaReturn {
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<UploadStatus>(UPLOAD_STATUS.INITIALIZING);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStep | null>(null);
    const [uploadDetails, setUploadDetails] = useState<Partial<UploadProgressInfo>>({});

    const pollIntervalRef = useRef<NodeJS.Timeout>();
    const currentUploadRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

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

    const startProcessingPoll = useCallback((trackingId: string) => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(async () => {
            try {
                const status = await uploadApi.getUploadStatus(trackingId);
                
                if ([UPLOAD_STATUS.COMPLETED, UPLOAD_STATUS.FAILED].includes(status.status as 'completed' | 'failed')) {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                    }
                    setStatus(status.status);
                    setIsProcessing(false);
                }

                if (status.processing?.currentStep) {
                    setProcessingStatus(status.processing.currentStep);
                }
            } catch (error) {
                console.error('Failed to check processing status:', error);
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            }
        }, 5000);
    }, []);

    const handleProgress = useCallback((info: UploadProgressInfo) => {
        setProgress(Math.min(info.percentage, 99));
        setUploadDetails(info);
    }, []);

    const uploadMedia = useCallback(async (
        file: File, 
        category: FileCategory
    ): Promise<UploadResponse> => {
        const startTime = Date.now();

        try {
            validateFile(file, category);
            setIsUploading(true);
            setError(null);
            setStatus(UPLOAD_STATUS.INITIALIZING);

            const response = await uploadApi.uploadFile(file, category, handleProgress);
            currentUploadRef.current = response.trackingId;
            
            setStatus(response.status);
            setProgress(100);

            if (response.status === UPLOAD_STATUS.PROCESSING) {
                setIsProcessing(true);
                startProcessingPoll(response.trackingId);
            }

            // Record success metric
            monitoringManager.metrics.recordMetric(
                MetricCategory.BUSINESS,
                'media',
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
            setStatus(UPLOAD_STATUS.FAILED);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setError(errorMessage);

            // Record failure metric
            monitoringManager.metrics.recordMetric(
                MetricCategory.BUSINESS,
                'media',
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
            setIsUploading(false);
        }
    }, [validateFile, handleProgress, startProcessingPoll]);

    const resumeUpload = useCallback(async (
        file: File,
        trackingId: string,
        lastChunk: number,
        category: FileCategory
    ): Promise<UploadResponse> => {
        try {
            validateFile(file, category);
            setIsUploading(true);
            setError(null);
            setStatus(UPLOAD_STATUS.RESUMING);

            const response = await uploadApi.resumeUpload(
                file,
                trackingId,
                lastChunk,
                category,
                handleProgress
            );

            currentUploadRef.current = response.trackingId;
            setStatus(response.status);

            if (response.status === UPLOAD_STATUS.PROCESSING) {
                setIsProcessing(true);
                startProcessingPoll(response.trackingId);
            }

            return response;
        } catch (error) {
            setStatus(UPLOAD_STATUS.FAILED);
            const errorMessage = error instanceof Error ? error.message : 'Resume failed';
            setError(errorMessage);
            throw error;
        } finally {
            setIsUploading(false);
        }
    }, [validateFile, handleProgress, startProcessingPoll]);

    const cancelUpload = useCallback(async (trackingId: string) => {
        try {
            await uploadApi.cancelUpload(trackingId);
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            resetUpload();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to cancel upload';
            setError(message);
            throw error;
        }
    }, []);

    const resetUpload = useCallback(() => {
        setProgress(0);
        setError(null);
        setIsUploading(false);
        setIsProcessing(false);
        setStatus(UPLOAD_STATUS.INITIALIZING);
        setProcessingStatus(null);
        setUploadDetails({});
        currentUploadRef.current = null;
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
    }, []);

    return {
        uploadMedia,
        resumeUpload,
        cancelUpload,
        resetUpload,
        progress,
        error,
        isUploading,
        isProcessing,
        status,
        processingStatus,
        currentChunk: uploadDetails.currentChunk,
        totalChunks: uploadDetails.totalChunks,
        uploadSpeed: uploadDetails.speed,
        timeRemaining: uploadDetails.remainingTime
    };
}