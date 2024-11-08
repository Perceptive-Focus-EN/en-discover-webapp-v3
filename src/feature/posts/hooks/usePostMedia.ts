// src/features/posts/hooks/usePostMedia.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { uploadApi, UploadResponse, UploadProgressInfo } from '@/lib/api/uploads';
import { 
    FileCategory, 
    UPLOAD_STATUS, 
    UploadStatus,
    UPLOAD_CONFIGS,
    UPLOAD_SETTINGS,
    ProcessingStep,
    CHUNKING_CONFIG
} from '@/UploadingSystem/constants/uploadConstants';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

// Enhanced types for better tracking
interface ChunkState {
    index: number;
    start: number;
    end: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempts: number;
    uploadedBytes: number;
}

interface UploadQueueState {
    chunks: Map<number, ChunkState>;
    activeChunks: Set<number>;
    file: File | null;
    category: FileCategory;
    startTime: number;
    totalBytes: number;
    uploadedBytes: number;
    lastSpeedUpdate: number;
    uploadSpeed: number;
}

interface MediaState {
    file: File | null;
    category: FileCategory;
    trackingId: string | null;
    uploadResponse: UploadResponse | null;
    lastChunk: number;
    retryCount: number;
}

// Return type remains the same for API compatibility
interface UsePostMediaReturn {
    upload: (file: File, category: FileCategory) => Promise<UploadResponse>;
    resumeUpload: (file: File, trackingId: string, lastChunk: number, category: FileCategory) => Promise<UploadResponse>;
    cancelUpload: (trackingId: string) => Promise<void>;
    retryUpload: () => Promise<UploadResponse | null>;
    resetUpload: () => void;
    progress: number;
    uploadStatus: UploadStatus;
    processingStatus: ProcessingStep | null;
    error: string | null;
    isUploading: boolean;
    isProcessing: boolean;
    currentChunk?: number;
    totalChunks?: number;
    speed?: number;
    remainingTime?: number;
    getUploadHistory: typeof uploadApi.getUploadHistory;
}

export function usePostMedia(): UsePostMediaReturn {
    // State management
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>(UPLOAD_STATUS.INITIALIZING);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStep | null>(null);
    const [detailedProgress, setDetailedProgress] = useState<Partial<UploadProgressInfo>>({});

    // Refs for memory management
    const mediaStateRef = useRef<MediaState>({
        file: null,
        category: UPLOAD_SETTINGS.DEFAULT_CATEGORY,
        trackingId: null,
        uploadResponse: null,
        lastChunk: 0,
        retryCount: 0
    });

    const uploadQueueRef = useRef<UploadQueueState>({
        chunks: new Map(),
        activeChunks: new Set(),
        file: null,
        category: UPLOAD_SETTINGS.DEFAULT_CATEGORY,
        startTime: 0,
        totalBytes: 0,
        uploadedBytes: 0,
        lastSpeedUpdate: 0,
        uploadSpeed: 0
    });

    const workerRef = useRef<Worker | null>(null);
    const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

    // Initialize Web Worker
    useEffect(() => {
        if (typeof Window !== 'undefined' && !workerRef.current) {
            workerRef.current = new Worker('/workers/fileProcessor.js');
            workerRef.current.onmessage = handleWorkerMessage;
        }

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
        };
    }, []);

    const handleWorkerMessage = useCallback((event: MessageEvent) => {
        const { type, data } = event.data;
        switch (type) {
            case 'chunk_processed':
                processChunk(data);
                break;
            case 'error':
                handleError(data);
                break;
        }
    }, []);

    const initializeUploadQueue = useCallback((
        file: File,
        category: FileCategory,
        startChunk: number = 0
    ) => {
        const chunkSize = CHUNKING_CONFIG.CHUNK_SIZE;
        const totalChunks = Math.ceil(file.size / chunkSize);
        const chunks = new Map<number, ChunkState>();

        for (let i = startChunk; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            chunks.set(i, {
                index: i,
                start,
                end,
                status: 'pending',
                attempts: 0,
                uploadedBytes: 0
            });
        }

        uploadQueueRef.current = {
            chunks,
            activeChunks: new Set(),
            file,
            category,
            startTime: Date.now(),
            totalBytes: file.size,
            uploadedBytes: startChunk * chunkSize,
            lastSpeedUpdate: Date.now(),
            uploadSpeed: 0
        };
    }, []);

    const updateProgress = (queue: UploadQueueState) => {
        const totalChunks = queue.chunks.size;
        const completedChunks = Array.from(queue.chunks.values()).filter(chunk => chunk.status === 'completed').length;
        const progress = (completedChunks / totalChunks) * 100;
        setProgress(progress);
    };

    const processChunk = useCallback(async (chunk: ChunkState) => {
        const queue = uploadQueueRef.current;
        if (!queue.file) return;

        try {
            const chunkBlob = queue.file.slice(chunk.start, chunk.end);
            const formData = new FormData();
            formData.append('chunk', chunkBlob);
            formData.append('index', chunk.index.toString());
            formData.append('total', queue.chunks.size.toString());

            if (mediaStateRef.current.trackingId) {
                formData.append('trackingId', mediaStateRef.current.trackingId);
            }

            const response = await uploadApi.uploadChunk(formData, {
                onUploadProgress: (progressEvent) => {
                    updateChunkProgress(chunk.index, progressEvent.loaded);
                }
            updateProgress(queue);

            chunk.status = 'completed';
            queue.chunks.set(chunk.index, chunk);
            queue.activeChunks.delete(chunk.index);

            // Update progress
            updateProgress();

            return response;
        } catch (error) {
            chunk.status = 'failed';
            chunk.attempts++;
            queue.chunks.set(chunk.index, chunk);
            queue.activeChunks.delete(chunk.index);
            throw error;
        }
    }, []);

    const updateChunkProgress = useCallback((chunkIndex: number, uploadedBytes: number) => {
        const queue = uploadQueueRef.current;
        const chunk = queue.chunks.get(chunkIndex);
        if (!chunk) return;

        const previousBytes = chunk.uploadedBytes;
        chunk.uploadedBytes = uploadedBytes;
        queue.chunks.set(chunkIndex, chunk);

        // Update total progress
        queue.uploadedBytes += (uploadedBytes - previousBytes);
        
        // Update speed calculation
        const now = Date.now();
        const timeDiff = (now - queue.lastSpeedUpdate) / 1000; // Convert to seconds
        if (timeDiff >= 1) { // Update speed every second
            queue.uploadSpeed = (queue.uploadedBytes / (now - queue.startTime)) * 1000; // bytes per second
            queue.lastSpeedUpdate = now;
        }

        setDetailedProgress({
            currentChunk: chunkIndex,
            totalChunks: queue.chunks.size,
            speed: queue.uploadSpeed,
            remainingTime: (queue.totalBytes - queue.uploadedBytes) / queue.uploadSpeed,
            percentage: (queue.uploadedBytes / queue.totalBytes) * 100
        });
    }, []);

    const processNextChunks = useCallback(async () => {
        const queue = uploadQueueRef.current;
        const maxConcurrent = CHUNKING_CONFIG.MAX_CONCURRENT;

        while (queue.activeChunks.size < maxConcurrent) {
            const pendingChunk = Array.from(queue.chunks.values())
                .find(chunk => chunk.status === 'pending');

            if (!pendingChunk) break;

            queue.activeChunks.add(pendingChunk.index);
            pendingChunk.status = 'processing';
            queue.chunks.set(pendingChunk.index, pendingChunk);

            processChunk(pendingChunk).catch(() => {
                // Error handling is done in processChunk
            });
        }
    }, [processChunk]);

    const uploadWithChunks = useCallback(async (
        file: File,
        category: FileCategory,
        startChunk: number = 0
    ): Promise<UploadResponse> => {
        try {
            initializeUploadQueue(file, category, startChunk);
            
            // Start upload process
            while (true) {
                await processNextChunks();

                const allCompleted = Array.from(uploadQueueRef.current.chunks.values())
                    .every(chunk => chunk.status === 'completed');

                if (allCompleted) break;

                const hasFailedChunks = Array.from(uploadQueueRef.current.chunks.values())
                    .some(chunk => chunk.status === 'failed' && chunk.attempts >= CHUNKING_CONFIG.MAX_RETRIES);

                if (hasFailedChunks) {
                    throw new Error('Upload failed after maximum retries');
                }

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Finalize upload
            const response = await uploadApi.finalizeUpload(mediaStateRef.current.trackingId!);
            return response;
        } finally {
            // Cleanup
            cleanupTimeoutRef.current = setTimeout(() => {
                if (global.gc) {
                    global.gc();
                }
            }, 1000);
        }
    }, [initializeUploadQueue, processNextChunks]);
  


    const handleError = useCallback((error: Error) => {
        setError(error.message);
        setUploadStatus(UPLOAD_STATUS.FAILED);
        messageHandler.error(error.message);
    }, []);

    const handleProcessingStatus = useCallback(async (response: UploadResponse) => {
        if (response.status === UPLOAD_STATUS.PROCESSING) {
            setIsProcessing(true);
            setProcessingStatus(response.processing?.currentStep || null);
            
            // Start polling for processing status
            const pollInterval = setInterval(async () => {
                try {
                    if (!mediaStateRef.current.trackingId) return;
                    const statusResponse = await uploadApi.getUploadStatus(mediaStateRef.current.trackingId);
                    setProcessingStatus(statusResponse.processing?.currentStep || null);
                    
                    if (statusResponse.status === UPLOAD_STATUS.COMPLETED) {
                        setIsProcessing(false);
                        clearInterval(pollInterval);
                    }
                } catch (error) {
                    console.error('Failed to check processing status:', error);
                }
            }, 5000);

            return () => clearInterval(pollInterval);
        }
        return undefined;
    }, []);

    const upload = useCallback(async (
        file: File, 
        category: FileCategory = UPLOAD_SETTINGS.DEFAULT_CATEGORY
    ): Promise<UploadResponse> => {
        try {
            setIsUploading(true);
            setError(null);
            setUploadStatus(UPLOAD_STATUS.INITIALIZING);
            
            // Validate file
            const config = UPLOAD_CONFIGS[category];
            if (!config.contentType.includes(file.type) && config.contentType[0] !== '*/*') {
                throw new Error(`Invalid file type. Allowed types: ${config.contentType.join(', ')}`);
            }
            if (file.size > config.maxSize) {
                throw new Error(`File exceeds size limit of ${config.maxSize / (1024 * 1024)}MB`);
            }

            // Initialize upload state
            mediaStateRef.current = {
                file,
                category,
                trackingId: null,
                uploadResponse: null,
                lastChunk: 0,
                retryCount: 0
            };

            // Initialize upload with backend to get trackingId
            const initResponse = await uploadApi.initializeUpload({
                filename: file.name,
                size: file.size,
                type: file.type,
                category
            });

            mediaStateRef.current.trackingId = initResponse.trackingId;

            // Perform upload based on file size
            let response: UploadResponse;
            if (file.size > CHUNKING_CONFIG.CHUNK_SIZE) {
                response = await uploadWithChunks(file, category);
            } else {
                response = await uploadApi.uploadFile(file, category);
            }

            mediaStateRef.current.uploadResponse = response;
            setUploadStatus(response.status);
            
            // Handle post-upload processing
            await handleProcessingStatus(response);

            return response;
        } catch (err) {
            handleError(err instanceof Error ? err : new Error('Upload failed'));
            throw err;
        } finally {
            setIsUploading(false);
        }
    }, [uploadWithChunks, handleProcessingStatus, handleError]);

    const resumeUpload = useCallback(async (
        file: File,
        trackingId: string,
        lastChunk: number,
        category: FileCategory
    ): Promise<UploadResponse> => {
        try {
            setIsUploading(true);
            setError(null);
            setUploadStatus(UPLOAD_STATUS.INITIALIZING);

            mediaStateRef.current = {
                file,
                category,
                trackingId,
                uploadResponse: null,
                lastChunk,
                retryCount: 0
            };

            const response = await uploadWithChunks(file, category, lastChunk);
            
            mediaStateRef.current.uploadResponse = response;
            setUploadStatus(response.status);
            await handleProcessingStatus(response);

            return response;
        } catch (err) {
            handleError(err instanceof Error ? err : new Error('Resume upload failed'));
            throw err;
        } finally {
            setIsUploading(false);
        }
    }, [uploadWithChunks, handleProcessingStatus, handleError]);

    const retryUpload = useCallback(async (): Promise<UploadResponse | null> => {
        const { file, category, trackingId, lastChunk, retryCount } = mediaStateRef.current;

        if (!file || retryCount >= CHUNKING_CONFIG.MAX_RETRIES) {
            return null;
        }

        mediaStateRef.current.retryCount++;

        return trackingId && lastChunk > 0
            ? resumeUpload(file, trackingId, lastChunk, category)
            : upload(file, category);
    }, [upload, resumeUpload]);

    const cancelUpload = useCallback(async (trackingId: string) => {
        try {
            await uploadApi.cancelUpload(trackingId);
            resetUpload();
        } catch (error) {
            messageHandler.error('Failed to cancel upload');
            throw error;
        }
    }, []);

    const resetUpload = useCallback(() => {
        setProgress(0);
        setError(null);
        setIsUploading(false);
        setIsProcessing(false);
        setUploadStatus(UPLOAD_STATUS.INITIALIZING);
        setProcessingStatus(null);
        setDetailedProgress({});
        
        mediaStateRef.current = {
            file: null,
            category: UPLOAD_SETTINGS.DEFAULT_CATEGORY,
            trackingId: null,
            uploadResponse: null,
            lastChunk: 0,
            retryCount: 0
        };

        uploadQueueRef.current.chunks.clear();
        uploadQueueRef.current.activeChunks.clear();
        
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
        }

        if (global.gc) {
            global.gc();
        }
    }, []);

    // Return the hook interface
    return {
        // Functions
        upload,
        resumeUpload,
        cancelUpload,
        retryUpload,
        resetUpload,
        getUploadHistory: uploadApi.getUploadHistory,

        // Basic State
        progress,
        uploadStatus,
        processingStatus,
        error,
        isUploading,
        isProcessing,

        // Detailed Progress
        currentChunk: detailedProgress.currentChunk,
        totalChunks: detailedProgress.totalChunks,
        speed: detailedProgress.speed,
        remainingTime: detailedProgress.remainingTime,
    };
