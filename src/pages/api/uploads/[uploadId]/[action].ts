// src/pages/api/uploads/[uploadId]/[action].ts

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { redisService } from '@/services/cache/redisService';
import { 
    COSMOS_COLLECTIONS, 
    UPLOAD_STATUS,
    UPLOAD_WEBSOCKET,
} from '@/constants/uploadConstants';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { chunkingService } from '@/services/ChunkingService';

// Constants
const CACHE_KEY_PREFIX = 'upload:state:';
const CACHE_TTL = 3600; // 1 hour

// Types
interface UploadState {
    id: string;
    status: string;
    userId: string;
    lastModified: Date;
    error?: string;
    lastSuccessfulChunk?: number;
    uploadedBytes?: number;
}

// Utility Functions
const getCacheKey = (uploadId: string) => `${CACHE_KEY_PREFIX}${uploadId}`;

const isValidAction = (action: string, currentStatus: keyof typeof UPLOAD_STATUS): boolean => {
    const validTransitions: { [key in keyof typeof UPLOAD_STATUS]?: string[] } = {
        INITIALIZING: ['cancel'],
        PROCESSING: ['pause', 'cancel'],
        PAUSED: ['resume', 'cancel'],
        FAILED: ['retry', 'cancel'],
        UPLOADING: [],
        RESUMING: [],
        COMPLETED: []
    };

    return (validTransitions[currentStatus] ?? []).includes(action);
};

const getNewStatus = (action: string): string => {
    switch (action) {
        case 'pause': return UPLOAD_STATUS.PAUSED;
        case 'resume': return UPLOAD_STATUS.RESUMING;
        case 'retry': return UPLOAD_STATUS.PROCESSING;
        case 'cancel': return UPLOAD_STATUS.FAILED;
        default: throw new Error(`Invalid action: ${action}`);
    }
};

// Main Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { uploadId, action } = req.query as { uploadId: string; action: string };
    const operationId = monitoringManager.logger.generateRequestId();
    const startTime = Date.now();

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
                uploadState = JSON.parse(cachedState);
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
            uploadState = await collection.findOne({ id: uploadId }) as UploadState | null;

            if (!uploadState) {
                return res.status(404).json({ message: 'Upload not found' });
            }

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
        if (uploadState.userId !== decodedToken.userId) {
            return res.status(403).json({ message: 'Unauthorized access to upload' });
        }

        // Validate action against current status
        if (!isValidAction(action, uploadState.status as keyof typeof UPLOAD_STATUS)) {
            return res.status(400).json({ 
                message: `Cannot ${action} upload in ${uploadState.status} state` 
            });
        }

        const newStatus = getNewStatus(action);
        const updateTime = new Date();
        const updateData = {
            status: newStatus,
            lastModified: updateTime,
            ...(action === 'cancel' ? { error: 'Upload cancelled by user' } : {})
        };

        // Update both Cosmos DB and Redis cache
        try {
            const { db } = await getCosmosClient();
            await Promise.all([
                // Update Cosmos DB
                db.collection(COSMOS_COLLECTIONS.UPLOADS).updateOne(
                    { id: uploadId },
                    { $set: updateData }
                ),
                // Update Redis cache
                redisService.setValue(
                    cacheKey,
                    JSON.stringify({ ...uploadState, ...updateData }),
                    CACHE_TTL
                )
            ]);
        } catch (error) {
            throw monitoringManager.error.createError(
                'system',
                'UPDATE_FAILED',
                'Failed to update upload status',
                { uploadId, action, error }
            );
        }

        // Control the upload through ChunkingService
        await chunkingService.controlUpload(
            uploadId, 
            action as 'pause' | 'resume' | 'retry' | 'cancel'
        );

        // Record metrics
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
                success: true
            }
        );

        // Send response
        res.status(200).json({
            message: `Upload ${action} successful`,
            uploadId,
            status: newStatus,
            lastModified: updateTime
        });

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