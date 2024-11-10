import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { redisService } from '@/services/cache/redisService';
import { 
    COSMOS_COLLECTIONS, 
    UPLOAD_STATUS,
    FileCategory,
    AccessLevel,
    RetentionType,
    ChunkStatus,
    UploadStatus,
    UPLOAD_SETTINGS
} from '@/UploadingSystem/constants/uploadConstants';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { chunkingService } from '@/UploadingSystem/services/ChunkingService';
import { BlockBlobClient } from '@azure/storage-blob';
import { 
    UploadState, 
    ChunkState, 
    ControlState, 
    UploadMetadata,  
} from '@/UploadingSystem/types/state';
import {BaseProgress} from '@/UploadingSystem/types/progress';

// Constants
const CACHE_KEY_PREFIX = 'upload:state:';
const CACHE_TTL = 3600; // 1 hour

// Type Guards
const isValidUploadState = (state: any): state is UploadState => {
    return state &&
        state.chunks instanceof Map &&
        typeof state.control === 'object' &&
        typeof state.metadata === 'object' &&
        typeof state.progress === 'object' &&
        state.blockBlobClient instanceof BlockBlobClient &&
        Array.isArray(state.blockIds);
};

// Utility Functions
const getCacheKey = (uploadId: string) => `${CACHE_KEY_PREFIX}${uploadId}`;

const convertDBStateToUploadState = async (dbState: any): Promise<UploadState> => {
    // Create a new BlockBlobClient instance from stored URL
    const blockBlobClient = new BlockBlobClient(dbState.blobUrl);

    // Convert chunks from DB format to Map
    const chunks = new Map<number, ChunkState>();
    (dbState.chunks || []).forEach((chunk: ChunkState) => {
        chunks.set(chunk.id, chunk);
    });

    return {
        userId: dbState.userId,
        tenantId: dbState.tenantId,
        chunks,
        control: {
            isPaused: dbState.status === UPLOAD_STATUS.PAUSED,
            isCancelled: dbState.status === UPLOAD_STATUS.FAILED,
            retryCount: dbState.retryCount || 0,
            lastRetryTimestamp: dbState.lastRetryTimestamp || 0,
            locked: false,
            leaseId: dbState.leaseId,
            userId: dbState.userId,
            tenantId: dbState.tenantId,
            isRunning: dbState.status === UPLOAD_STATUS.UPLOADING,
            isRetrying: dbState.status === UPLOAD_STATUS.RESUMING,
            isCompleted: dbState.status === UPLOAD_STATUS.COMPLETED,
            isFailed: dbState.status === UPLOAD_STATUS.FAILED
        },
        metadata: {
            fileName: dbState.fileName,
            fileSize: dbState.fileSize,
            mimeType: dbState.mimeType,
            category: dbState.category as FileCategory,
            accessLevel: dbState.accessLevel as AccessLevel,
            retention: dbState.retention as RetentionType,
            startTime: dbState.startTime,
            tempFilePath: dbState.tempFilePath,
            userId: dbState.userId,
            tenantId: dbState.tenantId,
            trackingId: dbState.id
        },
        progress: {
            trackingId: dbState.id,
            progress: dbState.progress || 0,
            chunksCompleted: dbState.chunksCompleted || 0,
            totalChunks: dbState.totalChunks || 0,
            uploadedBytes: dbState.uploadedBytes || 0,
            totalBytes: dbState.fileSize,
            status: dbState.status as UploadStatus,
            error: dbState.error,
            userId: dbState.userId,
            tenantId: dbState.tenantId
        },
        blockBlobClient,
        blockIds: dbState.blockIds || []
    };
};

const convertUploadStateToDBFormat = (state: UploadState) => ({
    chunks: Array.from(state.chunks.values()),
    status: state.progress.status,
    retryCount: state.control.retryCount,
    lastRetryTimestamp: state.control.lastRetryTimestamp,
    leaseId: state.control.leaseId,
    fileName: state.metadata.fileName,
    fileSize: state.metadata.fileSize,
    mimeType: state.metadata.mimeType,
    category: state.metadata.category,
    accessLevel: state.metadata.accessLevel,
    retention: state.metadata.retention,
    startTime: state.metadata.startTime,
    tempFilePath: state.metadata.tempFilePath,
    progress: state.progress.progress,
    chunksCompleted: state.progress.chunksCompleted,
    totalChunks: state.progress.totalChunks,
    uploadedBytes: state.progress.uploadedBytes,
    totalBytes: state.progress.totalBytes,
    error: state.progress.error,
    blobUrl: state.blockBlobClient.url,
    blockIds: state.blockIds
});

const isValidAction = (action: string, currentStatus: keyof typeof UPLOAD_STATUS): boolean => {
    const validTransitions: { [key in keyof typeof UPLOAD_STATUS]?: string[] } = {
        INITIALIZING: ['cancel'],
        PROCESSING: ['pause', 'cancel'],
        PAUSED: ['resume', 'cancel'],
        FAILED: ['retry', 'cancel'],
        UPLOADING: ['pause', 'cancel'],
        RESUMING: ['pause', 'cancel'],
        COMPLETED: []
    };

    return (validTransitions[currentStatus] ?? []).includes(action);
};

const getNewStatus = (action: string): UploadStatus => {
    switch (action) {
        case 'pause':
            return UPLOAD_STATUS.PAUSED;
        case 'cancel':
            return UPLOAD_STATUS.FAILED;
        case 'retry':
            return UPLOAD_STATUS.RESUMING;
        case 'resume':
            return UPLOAD_STATUS.UPLOADING;
        default:
            throw new Error(`Invalid action: ${action}`);
    }
}

const updateUploadState = (state: UploadState, action: string): Partial<UploadState> => {
    const newStatus = getNewStatus(action);

    return {
        control: {
            ...state.control,
            locked: action !== 'retry' && action !== 'cancel',
            isPaused: action === 'pause',
            isRunning: action === 'resume',
            isCancelled: action === 'cancel',
            isRetrying: action === 'retry',
            isCompleted: newStatus === UPLOAD_STATUS.COMPLETED,
            isFailed: newStatus === UPLOAD_STATUS.FAILED,
            retryCount: action === 'retry' ? state.control.retryCount + 1 : state.control.retryCount,
            lastRetryTimestamp: action === 'retry' ? Date.now() : state.control.lastRetryTimestamp
        },
        progress: {
            ...state.progress,
            status: newStatus
        }
    };
};

const releaseLease = async (state: UploadState) => {
    if (state.control.leaseId) {
        try {
            const leaseClient = state.blockBlobClient.getBlobLeaseClient(
                state.control.leaseId
            );
            await leaseClient.releaseLease();
            return true;
        } catch (error) {
            monitoringManager.logger.warn('Failed to release lease', {
                error,
                uploadId: state.metadata.trackingId
            });
            return false;
        }
    }
    return true;
};

const validateStateTransition = (
    currentState: UploadState,
    action: string
): boolean => {
    if (currentState.control.locked) {
        return false;
    }
    
    if (action === 'retry' && 
        currentState.control.retryCount >= UPLOAD_SETTINGS.MAX_RETRIES) {
        return false;
    }
    
    return isValidAction(action, currentState.progress.status as keyof typeof UPLOAD_STATUS);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { uploadId, action } = req.query as { uploadId: string; action: string };
    const operationId = monitoringManager.logger.generateRequestId();
    const startTime = Date.now();

    // Add request validation
    if (!uploadId || !action) {
        return res.status(400).json({ 
            message: 'Missing required parameters' 
        });
    }

    try {
        // Auth check
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw monitoringManager.error.createError('security', 'AUTH_TOKEN_MISSING', 'Authentication required');
        }

        const decodedToken = await verifyAccessToken(token);
        if (!decodedToken?.userId) {
            throw monitoringManager.error.createError('security', 'AUTH_TOKEN_INVALID', 'Invalid token provided');
        }

        // Check Redis cache first
        let uploadState: UploadState | null = null;
        const cacheKey = getCacheKey(uploadId);

        try {
            const cachedState = await redisService.getValue(cacheKey);
            if (cachedState) {
                const parsedState = JSON.parse(cachedState);
                if (isValidUploadState(parsedState)) {
                    uploadState = parsedState;
                    monitoringManager.metrics.recordMetric(
                        MetricCategory.PERFORMANCE,
                        'upload_control',
                        'cache_hit',
                        1,
                        MetricType.COUNTER,
                        MetricUnit.COUNT,
                        { uploadId, action }
                    );
                }
            }
        } catch (cacheError) {
            monitoringManager.logger.warn('Cache retrieval failed', {
                error: cacheError,
                uploadId
            });
        }

        // If not in cache, get from Cosmos DB
        if (!uploadState) {
            const { db } = await getCosmosClient();
            const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);
            const dbState = await collection.findOne({ id: uploadId });

            if (!dbState) {
                return res.status(404).json({ message: 'Upload not found' });
            }

            uploadState = await convertDBStateToUploadState(dbState);

            // Cache the result for future requests
            try {
                await redisService.setValue(
                    cacheKey,
                    JSON.stringify(uploadState),
                    CACHE_TTL
                );
            } catch (cacheError) {
                monitoringManager.logger.warn('Cache set failed', {
                    error: cacheError,
                    uploadId
                });
            }
        }

        // Verify ownership
        if (uploadState.metadata.userId !== decodedToken.userId) {
            return res.status(403).json({ message: 'Unauthorized access to upload' });
        }

        // Add state transition validation
        if (!validateStateTransition(uploadState, action)) {
            return res.status(400).json({
                message: 'Invalid state transition',
                currentState: uploadState.progress.status,
                requestedAction: action
            });
        }

        // Handle lease release for cancel action
        if (action === 'cancel') {
            const leaseReleased = await releaseLease(uploadState);
            if (!leaseReleased) {
                monitoringManager.logger.warn('Proceeding with cancel despite lease release failure', {
                    uploadId,
                    leaseId: uploadState.control.leaseId
                });
            }
        }

        // Create backup of current state for rollback
        const previousState = { ...uploadState };

        // Get Cosmos DB client
        const { db } = await getCosmosClient();

        try {
            // Update state based on action
            const stateUpdates = updateUploadState(uploadState, action);
            const updatedState = {
                ...uploadState,
                ...stateUpdates,
                lastModified: new Date()
            };

            // Update both Cosmos DB and Redis cache
            await Promise.all([
                db.collection(COSMOS_COLLECTIONS.UPLOADS).updateOne(
                    { id: uploadId },
                    { $set: convertUploadStateToDBFormat(updatedState) }
                ),
                redisService.setValue(
                    cacheKey,
                    JSON.stringify(updatedState),
                    CACHE_TTL
                )
            ]);

            // Control the upload through ChunkingService
            await chunkingService.controlUpload(
                uploadId,
                action as 'pause' | 'resume' | 'retry' | 'cancel'
            );

            // Record success metrics
            monitoringManager.metrics.recordMetric(
                MetricCategory.PERFORMANCE,
                'upload_control',
                'duration',
                Date.now() - startTime,
                MetricType.HISTOGRAM,
                MetricUnit.MILLISECONDS,
                {
                    uploadId,
                    action,
                    success: true,
                    newStatus: updatedState.progress.status
                }
            );

            // Send success response
            res.status(200).json({
                message: `Upload ${action} successful`,
                uploadId,
                status: updatedState.progress.status,
                progress: {
                    completed: updatedState.progress.chunksCompleted,
                    total: updatedState.progress.totalChunks,
                    percentage: updatedState.progress.progress
                },
                lastModified: updatedState.lastModified
            });

        } catch (updateError) {
            // Attempt rollback on failure
            try {
                await Promise.all([
                    db.collection(COSMOS_COLLECTIONS.UPLOADS).updateOne(
                        { id: uploadId },
                        { $set: convertUploadStateToDBFormat(previousState) }
                    ),
                    redisService.setValue(
                        cacheKey,
                        JSON.stringify(previousState),
                        CACHE_TTL
                    )
                ]);

                throw monitoringManager.error.createError(
                    'system',
                    'UPDATE_FAILED_WITH_ROLLBACK',
                    'Failed to update upload status, state rolled back',
                    { uploadId, action, error: updateError }
                );
            } catch (rollbackError) {
                throw monitoringManager.error.createError(
                    'system',
                    'UPDATE_AND_ROLLBACK_FAILED',
                    'Failed to update and rollback upload status',
                    { uploadId, action, updateError, rollbackError }
                );
            }
        }

    } catch (error) {
        monitoringManager.logger.error(error, SystemError.UPLOAD_CONTROL_FAILED as ErrorType, {
            operationId,
            uploadId,
            action,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Record error metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'upload_control',
            'failure',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                uploadId,
                action,
                errorType: error instanceof Error ? error.name : 'Unknown'
            }
        );

        res.status(500).json({
            error: 'UPLOAD_CONTROL_ERROR',
            message: `Failed to ${action} upload`,
            reference: operationId
        });
    }
}
