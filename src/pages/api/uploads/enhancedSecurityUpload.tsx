import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm } from 'formidable';
import { BlobServiceClient, BlockBlobClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { generateSasToken, generateBlobUrl } from '../../../config/azureStorage';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';
import {
    FileCategory,
    UPLOAD_CONFIGS,
    UPLOAD_SETTINGS,
    UPLOAD_PATHS,
    COSMOS_COLLECTIONS,
    UPLOAD_STATUS,
    CHUNKING_CONFIG,
    UploadStatus,
} from '../../../UploadingSystem/constants/uploadConstants';
import { chunkingService } from '../../../UploadingSystem/services/ChunkingService';
import { getAzureStorageCredentials } from '@/config/azureStorage';
import { UploadErrorResponse, UploadOptions, UploadStatusDetails, UploadSuccessResponse } from '@/UploadingSystem/types/upload';
import { ChunkingOptions } from '@/UploadingSystem/types/chunking';
import { DecodedToken } from '@/utils/TokenManagement/clientTokenUtils';
import { UploadState } from '@/UploadingSystem/types/state';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false
    }
};


interface UploadContext {
    userId: string;
    tenantId: string;
    operationId: string;
    trackingId: string;
    startTime: number;
}

class EnhancedUploadSystem {
    private static instance: EnhancedUploadSystem | null = null;
    private readonly containerName = UPLOAD_PATHS.CONTAINER;
    private currentUploadState = new Map<string, UploadState>();
    private initialized = false;

    private constructor() {}

    private async initialize() {
        if (this.initialized) return;

        try {
            const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
            const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
            const frontDoorEndpoint = process.env.AZURE_FRONT_DOOR_ENDPOINT;

            if (!accountName || !accountKey) {
                throw new Error('Missing required Azure Storage configuration');
            }

            const credential = new StorageSharedKeyCredential(accountName, accountKey);
            const endpoint = frontDoorEndpoint
                ? `https://${frontDoorEndpoint}`
                : `https://${accountName}.blob.core.windows.net`;

            const blobServiceClient = new BlobServiceClient(endpoint, credential);
            const containerClient = blobServiceClient.getContainerClient(this.containerName);

            if (!(await containerClient.exists())) {
                await containerClient.create({ access: 'blob' });
            }

            const { db } = await getCosmosClient();
            const collections = await db.collections();

            if (!collections.find(c => c.collectionName === COSMOS_COLLECTIONS.UPLOADS)) {
                await db.createCollection(COSMOS_COLLECTIONS.UPLOADS);
                const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);

                // Create indexes
                await Promise.all([
                    collection.createIndex({ trackingId: 1 }, { unique: true }),
                    collection.createIndex({ userId: 1 }),
                    collection.createIndex({ tenantId: 1 }),
                    collection.createIndex({ status: 1 }),
                    collection.createIndex({ lastModified: 1 }),
                    collection.createIndex({ userId: 1, tenantId: 1 }) // Compound index for user+tenant queries
                ]);
            }

            this.initialized = true;
            monitoringManager.logger.info('Upload system initialized', {
                container: this.containerName,
                endpoint: frontDoorEndpoint || `${accountName}.blob.core.windows.net`
            });
        } catch (error) {
            monitoringManager.logger.error(error as Error, SystemError.INITIALIZATION_FAILED as ErrorType);
            throw error;
        }
    }

    static async getInstance(): Promise<EnhancedUploadSystem> {
        if (!EnhancedUploadSystem.instance) {
            EnhancedUploadSystem.instance = new EnhancedUploadSystem();
            await EnhancedUploadSystem.instance.initialize();
        }
        return EnhancedUploadSystem.instance;
    }

    private async createBlobClient(
        file: any,
        context: UploadContext,
        configKey: FileCategory,
        credentials: StorageSharedKeyCredential
    ): Promise<BlockBlobClient> {
        try {
            const config = UPLOAD_CONFIGS[configKey];
            const blobName = UPLOAD_PATHS.generateBlobPath({
                tenantId: context.tenantId,
                category: config.category,
                userId: context.userId,
                trackingId: context.trackingId,
                fileName: file.originalFilename || 'unnamed'
            });

            const blobServiceClient = new BlobServiceClient(
                process.env.AZURE_FRONT_DOOR_ENDPOINT
                    ? `https://${process.env.AZURE_FRONT_DOOR_ENDPOINT}`
                    : `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
                credentials
            );

            const containerClient = blobServiceClient.getContainerClient(this.containerName);
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            if (!(await blockBlobClient.exists())) {
                await blockBlobClient.uploadData(Buffer.from(''), {
                    blobHTTPHeaders: {
                        blobContentType: file.mimetype || 'application/octet-stream',
                        blobContentDisposition: 'inline',
                        blobCacheControl: 'public, max-age=31536000'
                    }
                });
            }

            const leaseClient = blockBlobClient.getBlobLeaseClient();
            const lease = await leaseClient.acquireLease(60);

            if (context.trackingId) {
                const newState: UploadState = {
                    chunks: new Map(),
                    control: {
                        isPaused: false,
                        isCancelled: false,
                        retryCount: 0,
                        lastRetryTimestamp: 0,
                        locked: false,
                        leaseId: lease.leaseId
                    },
                    metadata: {
                        fileName: file.originalFilename || 'unnamed',
                        fileSize: file.size,
                        mimeType: file.mimetype || 'application/octet-stream',
                        category: config.category,
                        accessLevel: config.accessLevel,
                        retention: config.retention,
                        startTime: Date.now()
                    },
                    progress: {
                        trackingId: context.trackingId,
                        progress: 0,
                        chunksCompleted: 0,
                        totalChunks: 0,
                        uploadedBytes: 0,
                        totalBytes: file.size,
                        status: UPLOAD_STATUS.INITIALIZING
                    },
                    blockBlobClient,
                    blockIds: []
                };
                this.currentUploadState.set(context.trackingId, newState);
            }
            
            return blockBlobClient;
        } catch (error) {
            monitoringManager.logger.error(error as Error, SystemError.STORAGE_UPLOAD_FAILED as ErrorType, {
                fileName: file.originalFilename,
                category: configKey,
                container: this.containerName,
            });
            throw error;
        }
    }

    async handleUpload(
        req: NextApiRequest,
        res: NextApiResponse<UploadSuccessResponse | UploadErrorResponse>,
        decodedToken: any,
        operationId: string,
        credentials: StorageSharedKeyCredential
    ): Promise<void> {
        let context: UploadContext | null = null;

        try {
            context = {
                userId: decodedToken.userId,
                tenantId: decodedToken.tenantId,
                operationId,
                trackingId: uuidv4(),
                startTime: Date.now()
            };

            const configKey = (req.query.type as FileCategory) || UPLOAD_SETTINGS.DEFAULT_CATEGORY;
            const config = UPLOAD_CONFIGS[configKey];

            const form = new IncomingForm({
                maxFileSize: config.maxSize,
                maxFiles: UPLOAD_SETTINGS.MAX_CONCURRENT_UPLOADS,
                multiples: UPLOAD_SETTINGS.FORM.MULTIPLES,
                uploadDir: UPLOAD_SETTINGS.FORM.UPLOAD_DIR,
                keepExtensions: UPLOAD_SETTINGS.FORM.KEEP_EXTENSIONS,
                filename: (name, ext, part) => {
                    const uniqueName = `${uuidv4()}${ext}`;
                    return uniqueName.substring(0, UPLOAD_SETTINGS.FORM.FILE_NAME_LENGTH);
                }
            });

            const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) reject(err);
                    resolve([fields, files]);
                });
            });

            const file = Array.isArray(files.file) ? files.file[0] : files.file;
            if (!file) {
                throw monitoringManager.error.createError('business', 'NO_FILE', 'No file provided');
            }

            if (file.size > config.maxSize) {
                throw monitoringManager.error.createError(
                    'business',
                    'FILE_TOO_LARGE',
                    `File exceeds maximum size of ${config.maxSize} bytes`
                );
            }

            if (!config.contentType.includes('*/*') && !config.contentType.includes(file.mimetype || '')) {
                throw monitoringManager.error.createError(
                    'business',
                    'INVALID_FILE_TYPE',
                    `File type ${file.mimetype} not allowed for ${configKey}`
                );
            }

            const blockBlobClient = await this.createBlobClient(file, context, configKey, credentials);

            const uploadOptions: UploadOptions = {
                onProgress: (progress, chunkIndex, totalChunks, uploadedBytes) => {
                    if (context) {
                        const state = this.currentUploadState.get(context.trackingId);
                        if (state) {
                            state.progress.chunksCompleted = chunkIndex;
                            state.progress.totalChunks = totalChunks;
                            state.progress.uploadedBytes = uploadedBytes;
                            state.progress.progress = (uploadedBytes / state.metadata.fileSize) * 100;
                        }
                    }
                },
                userId: context.userId,
                trackingId: context.trackingId,
                fileSize: file.size
            };
            
            const chunkingOptions: ChunkingOptions = {
                chunkSize: CHUNKING_CONFIG.CHUNK_SIZE,
                maxRetries: CHUNKING_CONFIG.MAX_RETRIES,
                retryDelayBase: CHUNKING_CONFIG.RETRY_DELAY_BASE,
                maxConcurrent: CHUNKING_CONFIG.MAX_CONCURRENT,
                resumeFromChunk: req.query.resumeFrom ? parseInt(req.query.resumeFrom as string) : undefined
            };

            await chunkingService.uploadWithChunkingV2(
                file,
                blockBlobClient,
                uploadOptions,
                chunkingOptions
            );

            const sasToken = await generateSasToken(blockBlobClient.name);
            const fileUrl = generateBlobUrl(blockBlobClient.name, sasToken);

            const duration = Date.now() - context.startTime;

            await this.updateUploadStatus(
                context.trackingId,
                UPLOAD_STATUS.COMPLETED,
                {
                    completedAt: new Date(),
                    fileUrl,
                    duration,
                    processingSteps: config.processingSteps
                },
                decodedToken // Pass the token here
            );

            res.status(200).json({
                message: 'Upload successful',
                trackingId: context.trackingId,
                fileUrl,
                status: UPLOAD_STATUS.COMPLETED,
                metadata: {
                    category: configKey,
                    accessLevel: config.accessLevel,
                    retention: config.retention,
                    processingSteps: config.processingSteps,
                    duration
                }
            });
        } catch (error) {
            if (context?.trackingId) {
                await this.updateUploadStatus(
                    context.trackingId,
                    UPLOAD_STATUS.FAILED,
                    {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        completedAt: new Date(),
                        lastSuccessfulChunk: chunkingService.getLastSuccessfulChunk(context.trackingId),
                        uploadedBytes: chunkingService.getUploadedBytes(context.trackingId)
                    },
                    decodedToken // Pass the token here too
                );
            }

            monitoringManager.logger.error(error as Error, SystemError.STORAGE_UPLOAD_FAILED as ErrorType, {
                operationId: context?.operationId,
                requestHeaders: req.headers,
                requestUrl: req.url,
                requestMethod: req.method,
                trackingId: context?.trackingId
            });

            res.status(500).json({
                error: 'UPLOAD_INTERRUPTED',
                message: 'Connection lost during upload',
                trackingId: context?.trackingId,
                canResume: true
            });
        } finally {
            if (context?.trackingId) {
                this.cleanupUploadState(context.trackingId);
            }
        }
    }

    async getUserUploads(userId: string, tenantId: string, options?: {
    status?: UploadStatus;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'lastModified';
    sortOrder?: 'asc' | 'desc';
}): Promise<any[]> {
    const { db } = await getCosmosClient();
    const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);

    const query: { userId: string; tenantId: string; status?: UploadStatus } = { userId, tenantId };
    if (options?.status) {
        query.status = options.status;
    }

    const cursor = collection.find(query)
        .sort({ [options?.sortBy || 'createdAt']: options?.sortOrder === 'asc' ? 1 : -1 })
        .skip(options?.offset || 0)
        .limit(options?.limit || 50);

    return cursor.toArray();
    }

    private async updateUploadStatus(
        trackingId: string,
        status: UploadStatus,
        details: UploadStatusDetails,
        decodedToken: DecodedToken
    ): Promise<void> {
        try {
            const { db } = await getCosmosClient();
            const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);

            // Use trackingId as the query field instead of id
            const existing = await collection.findOne({ trackingId });

            if (existing) {
                await collection.updateOne(
                    { trackingId }, // Use trackingId in query
                    {
                        $set: {
                            status,
                            lastModified: new Date(),
                            ...details
                        }
                    }
                );
            } else {
                await collection.insertOne({
                    id: uuidv4(),
                    trackingId,
                    userId: decodedToken.userId, // Add userId
                    tenantId: decodedToken.tenantId, // Add tenantId
                    status,
                    lastModified: new Date(),
                    createdAt: new Date(),
                    ...details
                });
            }

            // Record metric with user context
            monitoringManager.metrics.recordMetric(
                MetricCategory.SYSTEM,
                'database',
                'upload_status_update',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                {
                    status,
                    trackingId,
                    userId: decodedToken.userId,
                    tenantId: decodedToken.tenantId,
                    operation: existing ? 'update' : 'insert'
                }
            );

        } catch (error) {
            // If it's a duplicate key error, try updating instead
            if ((error as any)?.code === 11000) {
                try {
                    const { db } = await getCosmosClient();
                    const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);
                    await collection.updateOne(
                        { trackingId },
                        {
                            $set: {
                                status,
                                lastModified: new Date(),
                                ...details
                            }
                        },
                        { upsert: true }
                    );
                    return;
                } catch (retryError) {
                    // If retry fails, throw the original error
                    throw error;
                }
            }

            monitoringManager.logger.error(error as Error, SystemError.DATABASE_OPERATION_FAILED as ErrorType, {
                operation: 'updateUploadStatus',
                trackingId,
                status,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw monitoringManager.error.createError(
                'system',
                SystemError.DATABASE_OPERATION_FAILED,
                'Failed to update upload status',
                { trackingId, status }
            );
        }
    }

    private cleanupUploadState(trackingId: string) {
        this.currentUploadState.delete(trackingId);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const operationId = monitoringManager.logger.generateRequestId();
    const startTime = Date.now();
    const maxRetries = 3;
    let retryCount = 0;

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw monitoringManager.error.createError('security', 'AUTH_TOKEN_MISSING', 'Authentication required');
        }

        const decodedToken = await verifyAccessToken(token);
        if (!decodedToken?.userId) {
            throw monitoringManager.error.createError('security', 'AUTH_TOKEN_INVALID', 'Invalid token provided');
        }

        const uploadSystem = await EnhancedUploadSystem.getInstance();
        let lastError: Error | null = null;

        while (retryCount < maxRetries) {
            try {
                const credentials = await getAzureStorageCredentials();
                await uploadSystem.handleUpload(req, res, decodedToken, operationId, credentials);
                return;
            } catch (error) {
                lastError = error;

                if (error.message?.includes('authenticate the request') && retryCount < maxRetries - 1) {
                    retryCount++;
                    monitoringManager.logger.warn('Retrying upload due to auth error', {
                        operationId,
                        attempt: retryCount,
                        error: error.message
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    continue;
                }

                throw error;
            }
        }

        throw lastError || new Error('Upload failed after maximum retries');

    } catch (error) {
        monitoringManager.logger.error(error, SystemError.STORAGE_UPLOAD_FAILED as ErrorType, {
            operationId,
            method: req.method,
            url: req.url,
            headers: req.headers,
            retryCount,
            duration: Date.now() - startTime
        });

        res.status(500).json({
            error: 'UPLOAD_SYSTEM_ERROR',
            message: 'Failed to process upload',
            reference: operationId,
            retryCount
        });
    }
}
