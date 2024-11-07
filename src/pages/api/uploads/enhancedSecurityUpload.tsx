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
    COLLECTIONS_SCHEMA,
    CHUNKING_CONFIG,
    type UploadStatus,
    type UploadDocument,
    type UploadProgress,
    UploadStatusDetails,
    UploadSuccessResponse,
    UploadErrorResponse,
    ChunkingOptions,
    UploadOptions
} from '../../../constants/uploadConstants';
import { chunkingService } from '../../../services/ChunkingService';
import { getAzureStorageCredentials } from '@/config/azureStorage';
import { COLLECTIONS } from '@/constants/collections';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false
    }
};


// At the top of the file, add interfaces
export interface UploadState {
    leaseId?: string;
    uploadedChunks: number[];
}


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

            // Initialize database collection
            const { db } = await getCosmosClient();
            const collections = await db.collections();
            
            if (!collections.find(c => c.collectionName === COSMOS_COLLECTIONS.UPLOADS)) {
                await db.createCollection(COSMOS_COLLECTIONS.UPLOADS);
                
                // Create indexes
                const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);
                await collection.createIndex({ trackingId: 1 }, { unique: true });
                await collection.createIndex({ status: 1 });
                await collection.createIndex({ lastModified: 1 });
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
                this.currentUploadState.set(context.trackingId, { leaseId: lease.leaseId, uploadedChunks: [] });
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
                    this.currentUploadState.get(context.trackingId)?.uploadedChunks.push(chunkIndex);
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
            resumeFromChunk: req.query.resumeFrom ? 
                parseInt(req.query.resumeFrom as string) : undefined
        };

    await chunkingService.uploadWithChunkingV2(  // Use V2 version CHANGE IF YOU PREFER V1
            file,
            blockBlobClient,
            uploadOptions,
            chunkingOptions
        );
            
            const sasToken = await generateSasToken(blockBlobClient.name);
            const fileUrl = generateBlobUrl(blockBlobClient.name, sasToken);

            const duration = Date.now() - context.startTime;
            await this.updateUploadStatus(context.trackingId, UPLOAD_STATUS.COMPLETE, {
                completedAt: new Date(),
                fileUrl,
                duration,
                processingSteps: config.processingSteps
            });

            res.status(200).json({
                message: 'Upload successful',
                trackingId: context.trackingId,
                fileUrl,
                status: UPLOAD_STATUS.COMPLETE,
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
                await this.updateUploadStatus(context.trackingId, UPLOAD_STATUS.ERROR, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date(),
                    lastSuccessfulChunk: chunkingService.getLastSuccessfulChunk(context.trackingId),
                    uploadedBytes: chunkingService.getUploadedBytes(context.trackingId)
                });
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

    private async updateUploadStatus(
        trackingId: string, 
        status: UploadStatus, 
        details: UploadStatusDetails
    ): Promise<void> {
        try {
            const { db } = await getCosmosClient();
            const collection = db.collection(COSMOS_COLLECTIONS.UPLOADS);
            
            await collection.updateOne(
                { id: trackingId },
                { 
                    $set: {
                        status,
                        lastModified: new Date(),
                        ...details
                    }
                },
                { upsert: true } // Create if doesn't exist
            );

            // Record metric for successful database operation
            monitoringManager.metrics.recordMetric(
                MetricCategory.SYSTEM,
                'database',
                'upload_status_update',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                {
                    status,
                    trackingId
                }
            );
        } catch (error) {
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
        // Extract and verify the authentication token
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
                // Get Azure storage credentials for the current attempt
                const credentials = await getAzureStorageCredentials();
                await uploadSystem.handleUpload(req, res, decodedToken, operationId, credentials);
                return; // Exit if upload succeeds
            } catch (error) {
                lastError = error;

                // Check if error is related to authentication and handle retries
                if (error.message?.includes('authenticate the request') && retryCount < maxRetries - 1) {
                    retryCount++;
                    monitoringManager.logger.warn('Retrying upload due to auth error', {
                        operationId,
                        attempt: retryCount,
                        error: error.message
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
                    continue;
                }

                // Break out of retry loop for non-authentication errors
                throw error;
            }
        }

        // Throw the last encountered error if all retries fail
        throw lastError || new Error('Upload failed after maximum retries');

    } catch (error) {
        // Log the error with detailed request and operation context
        monitoringManager.logger.error(error, SystemError.STORAGE_UPLOAD_FAILED as ErrorType, {
            operationId,
            method: req.method,
            url: req.url,
            headers: req.headers,
            retryCount,
            duration: Date.now() - startTime
        });

        // Return error response, including retry information for client
        res.status(500).json({
            error: 'UPLOAD_SYSTEM_ERROR',
            message: 'Failed to process upload',
            reference: operationId,
            retryCount
        });
    }
}
