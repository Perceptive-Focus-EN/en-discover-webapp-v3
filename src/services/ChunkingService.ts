import {  monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { UPLOAD_SETTINGS } from '../constants/uploadConstants';
import { BlockBlobClient } from '@azure/storage-blob';
import fs from 'fs';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';

// Add these imports
import WebSocket, { Server as WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import formidable from 'formidable';
import { ChunkConfig, ChunkingOptions, ChunkMetadata, ChunkProgress, ChunkUploadResult, EnhancedProgress, UploadCleanupMetadata, UploadProgressEvent, UploadState } from '@/types/chunking';
import { 
    UPLOAD_STATUS,
    CHUNKING_CONFIG 
} from '../constants/uploadConstants';
import {  UPLOAD_WEBSOCKET } from '../constants/uploadConstants';
import { UploadOptions } from '@/types/upload';


export class ChunkingService extends EventEmitter {

    private static instance: ChunkingService | null = null;
    private readonly config: ChunkConfig;
    private currentUploadState: Map<string, UploadState> = new Map();
    private uploadControlState = new Map<string, {
        retryCount: number;
        lastRetryTimestamp: number;
        isPaused: boolean;
        isCancelled: boolean;
    }>();

    
    // Add to your existing constructortions);
    private constructor() {
        super();
        this.config = {
            chunkSize: UPLOAD_SETTINGS.CHUNK_SIZE,
            maxRetries: UPLOAD_SETTINGS.MAX_RETRIES,
            retryDelayBase: UPLOAD_SETTINGS.RETRY_DELAY_BASE,
            maxConcurrent: UPLOAD_SETTINGS.MAX_CONCURRENT_UPLOADS
        };
            // Setup periodic cleanup
        setInterval(() => this.performPeriodicCleanup(), 5 * 60 * 1000); // Every 5 minutes
    }


    private optimizeChunkSize(fileSize: number, connectionSpeed?: number): number {
    const baseSize = CHUNKING_CONFIG.CHUNK_SIZE;
    if (fileSize > 1024 * 1024 * 1024) { // 1GB
        return baseSize * 4;
    }
    return baseSize;
}

    static getInstance(): ChunkingService {
        if (!this.instance) {
            this.instance = new ChunkingService();
        }
        return this.instance;
    }

    protected async performPeriodicCleanup(): Promise<void> {
        const now = Date.now();
        const staleTimeout = 30 * 60 * 1000; // 30 minutes

        for (const [trackingId, state] of this.currentUploadState.entries()) {
            if (now - state.startTime > staleTimeout) {
                await this.cleanupUploadState({
                    trackingId,
                    reason: 'cancellation',
                    finalState: state
                });
            }
        }
    }

    private calculateChunks(fileSize: number, chunkSize?: number): ChunkMetadata[] {
    const chunks: ChunkMetadata[] = [];
    let position = 0;
    let index = 0;
    const actualChunkSize = chunkSize || this.config.chunkSize;

    while (position < fileSize) {
        const currentChunkSize = Math.min(actualChunkSize, fileSize - position);
        chunks.push({
            id: index++,
            start: position,
            end: position + currentChunkSize - 1,
            size: currentChunkSize,
            attempts: 0
        });
        position += currentChunkSize;
    }

    return chunks;
    }

       protected async cleanupUploadState(metadata: UploadCleanupMetadata): Promise<void> {
        const { trackingId, reason, error, finalState } = metadata;
        
        try {
            const state = finalState || this.currentUploadState.get(trackingId);
            if (!state) return;

            // Cleanup blob storage
            if (state.blockBlobClient && reason !== 'completion') {
                await this.cleanupFailedUpload(trackingId, state.blockBlobClient, state.leaseId);
            }

            // Release lease if exists
            if (state.leaseId) {
                try {
                    const leaseClient = state.blockBlobClient.getBlobLeaseClient(state.leaseId);
                    await leaseClient.releaseLease();
                } catch (leaseError) {
                    monitoringManager.logger.warn('Failed to release lease during cleanup', {
                        trackingId,
                        error: leaseError
                    });
                }
            }

            // Cleanup temporary files
            if (state.tempFilePath) {
                try {
                    await fs.promises.unlink(state.tempFilePath);
                } catch (fileError) {
                    monitoringManager.logger.warn('Failed to cleanup temporary file', {
                        trackingId,
                        filePath: state.tempFilePath,
                        error: fileError
                    });
                }
            }

            // Clear state
            this.currentUploadState.delete(trackingId);
            this.uploadControlState.delete(trackingId);

            // Emit cleanup event
            this.emit(UPLOAD_WEBSOCKET.EVENTS.CLEANUP, {
                trackingId,
                reason,
                error: error?.message,
                finalState: {
                    uploadedBytes: state.uploadedBytes,
                    totalBytes: state.totalBytes,
                    chunksCompleted: state.completedChunks.size
                }
            });

        } catch (cleanupError) {
            monitoringManager.logger.error(cleanupError, SystemError.CHUNK_CLEANUP_FAILED, {
                trackingId,
                reason,
                originalError: error
            });
        }
    }


        protected async retryFailedChunks(
        trackingId: string,
        failedChunks: ChunkMetadata[],
        file: any,
        blockBlobClient: BlockBlobClient,
        leaseId?: string,
        userId?: string
    ): Promise<ChunkUploadResult[]> {
        const control = this.getUploadControl(trackingId);
        const maxRetryAttempts = this.config.maxRetries;
        const results: ChunkUploadResult[] = [];

        for (const chunk of failedChunks) {
            if (control.isCancelled) break;

            const retryResult = await this.retryChunkUpload(
                chunk,
                file,
                blockBlobClient,
                leaseId,
                trackingId,
                userId,
                maxRetryAttempts
            );

            results.push(retryResult);

            // Emit retry progress
            this.emit(UPLOAD_WEBSOCKET.EVENTS.RETRY, {
                trackingId,
                chunkId: chunk.id,
                attempt: retryResult.attempts,
                success: retryResult.success,
                error: retryResult.error?.message
            });

            if (!retryResult.success) {
                throw new Error(`Failed to upload chunk ${chunk.id} after ${maxRetryAttempts} attempts`);
            }
        }

        return results;
    }

    protected async retryChunkUpload(
        chunk: ChunkMetadata,
        file: any,
        blockBlobClient: BlockBlobClient,
        leaseId: string | undefined,
        trackingId: string,
        userId: string | undefined,
        maxAttempts: number
    ): Promise<ChunkUploadResult> {
        const startTime = Date.now();
        let attempts = 0;
        let lastError: Error | undefined;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const blockId = await this.uploadChunk(
                    chunk,
                    file,
                    blockBlobClient,
                    progress => this.emitProgress(trackingId!, userId!, file, this.calculateChunks(file.size)),
                    leaseId,
                    trackingId,
                    userId
                );

                return {
                    chunkId: chunk.id,
                    blockId,
                    attempts,
                    duration: Date.now() - startTime,
                    success: true
                };
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (attempts < maxAttempts) {
                    const delayMs = this.calculateRetryDelay(attempts);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }

        return {
            chunkId: chunk.id,
            blockId: '',
            attempts,
            duration: Date.now() - startTime,
            success: false,
            error: lastError
        };
    }

    private calculateRetryDelay(attempt: number): number {
        return this.config.retryDelayBase * Math.pow(2, attempt);
    }

    private async lockUploadState(trackingId: string): Promise<void> {
        while (this.currentUploadState.get(trackingId)?.locked) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const state = this.currentUploadState.get(trackingId);
        if (state) {
            state.locked = true;
        }
    }

    private releaseUploadState(trackingId: string): void {
        const state = this.currentUploadState.get(trackingId);
        if (state) {
            state.locked = false;
        }
    }

    private async updateUploadProgress(
        trackingId: string, 
        chunkId: number, 
        blockId: string, 
        chunkSize: number
    ): Promise<void> {
        try {
            await this.lockUploadState(trackingId);
            const state = this.currentUploadState.get(trackingId);
            if (state) {
                state.completedChunks.add(chunkId);
                state.lastSuccessfulChunk = Math.max(state.lastSuccessfulChunk, chunkId);
                state.uploadedBytes += chunkSize;
                state.blockIds[chunkId] = blockId;
            }
        } finally {
            this.releaseUploadState(trackingId);
        }
    }


    private async readChunkToBuffer(
        filepath: string,
        start: number,
        size: number
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const stream = fs.createReadStream(filepath, {
                start,
                end: start + size - 1,
                highWaterMark: 64 * 1024 // 64KB chunks
            });

            stream.on('data', (chunk: Buffer) => {
                chunks.push(Buffer.from(chunk));
            });

            stream.on('end', () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    if (buffer.length !== size) {
                        reject(new Error(`Expected chunk size ${size}, got ${buffer.length}`));
                        return;
                    }
                    resolve(buffer);
                } catch (error) {
                    reject(error);
                }
            });

            stream.on('error', reject);
            
            stream.on('close', () => {
                stream.destroy();
            });
        });
    }

    private async uploadChunk(
    chunk: ChunkMetadata,
    file: any,
    blockBlobClient: BlockBlobClient,
    onProgress: (progress: ChunkProgress) => void,
    leaseId?: string,
    trackingId?: string,
    userId?: string
    ): Promise<string> {
        
     // At the start of the method
    if (trackingId) {
        const control = this.getUploadControl(trackingId);
        if (control.isCancelled) {
            throw monitoringManager.error.createError(
                'business',
                'UPLOAD_CANCELLED',
                'Upload was cancelled'
            );
        }
        while (control.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const chunkId = `block-${chunk.id.toString().padStart(6, '0')}`;
        const encodedChunkId = Buffer.from(chunkId).toString('base64');




        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                onProgress({
                    chunkId,
                    progress: 0,
                    status: 'uploading'
                });

                monitoringManager.logger.debug('Reading chunk', {
                    chunkId,
                    start: chunk.start,
                    size: chunk.size,
                    attempt: attempt + 1
                });

                const buffer = await this.readChunkToBuffer(file.filepath, chunk.start, chunk.size);

                monitoringManager.logger.debug('Uploading chunk', {
                    chunkId,
                    size: buffer.length,
                    attempt: attempt + 1
                });

                 await blockBlobClient.stageBlock(
                encodedChunkId,
                buffer,
                buffer.length,
                { conditions: { leaseId } }
                 );
                
                onProgress({
                chunkId,
                progress: 100,
                status: 'completed'
            });

                // Emit progress after successful chunk upload
            if (trackingId && userId) {
                await this.updateUploadProgress(trackingId, chunk.id, encodedChunkId, chunk.size);
                this.emitProgress(trackingId!, userId!, file, this.calculateChunks(file.size));
            }

            return encodedChunkId;

            } catch (error) {
                const isLastAttempt = attempt === this.config.maxRetries - 1;

                if ((error as any)?.code === 'LeaseIdMissing') {
                    monitoringManager.logger.error(new Error('Lease required for upload'), SystemError.LEASE_REQUIRED as ErrorType, {
                        chunkId,
                        attempt: attempt + 1
                    });
                    throw error;
                }

                monitoringManager.logger.warn('Chunk upload attempt failed', {
                    chunkId,
                    attempt: attempt + 1,
                    isLastAttempt,
                    error: error instanceof Error ? {
                        message: error.message,
                        name: error.name,
                        code: (error as any).code,
                        statusCode: (error as any).statusCode
                    } : 'Unknown error'
                });

                if (!isLastAttempt) {
                    const delayMs = this.config.retryDelayBase * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                } else {
                    throw error;
                }
            }
        }

        throw new Error(`Failed to upload chunk ${chunkId} after ${this.config.maxRetries} attempts`);
    }


    public async controlUpload(
    uploadId: string,
    action: 'pause' | 'resume' | 'retry' | 'cancel'
): Promise<void> {
    const state = this.currentUploadState.get(uploadId);
    const control = this.getUploadControl(uploadId);
    
    if (!state) {
        throw new Error('Upload not found');
    }

    switch (action) {
        case 'pause':
            control.isPaused = true;
            this.emit(UPLOAD_WEBSOCKET.EVENTS.PAUSED, {
                trackingId: uploadId,
                status: UPLOAD_STATUS.PAUSED
            });
            break;

        case 'resume':
            control.isPaused = false;
            this.emit(UPLOAD_WEBSOCKET.EVENTS.RESUMED, {
                trackingId: uploadId,
                status: UPLOAD_STATUS.UPLOADING
            });
            break;

        case 'retry':
            control.isPaused = false;
            control.isCancelled = false;
            // Re-initialize the upload state if needed
            if (!this.currentUploadState.has(uploadId)) {
                this.initializeUploadState(uploadId, state.blockBlobClient);
            }
            this.emit(UPLOAD_WEBSOCKET.EVENTS.RESUMED, {
                trackingId: uploadId,
                status: UPLOAD_STATUS.UPLOADING
            });
            break;

        case 'cancel':
            control.isCancelled = true;
            await this.cleanupFailedUpload(uploadId, state.blockBlobClient, state.leaseId);
            this.emit(UPLOAD_WEBSOCKET.EVENTS.ERROR, {
                trackingId: uploadId,
                status: UPLOAD_STATUS.FAILED,
                error: 'Upload cancelled by user'
            });
            break;

        default:
            throw new Error(`Invalid action: ${action}`);
    }
}


        private async cleanupFailedUpload(
        trackingId: string,
        blockBlobClient: BlockBlobClient,
        leaseId?: string
    ): Promise<void> {
        try {
            const blockList = await blockBlobClient.getBlockList('uncommitted', {
                conditions: { leaseId }
            });

            if (blockList.uncommittedBlocks?.length) {
                await blockBlobClient.commitBlockList([], {
                    conditions: { leaseId }
                });
            }
        } catch (error) {
            monitoringManager.logger.warn('Failed to cleanup upload', {
                trackingId,
                error: error instanceof Error ? {
                    message: error.message,
                    code: (error as any).code
                } : 'Unknown error'
            });
        } finally {
            this.currentUploadState.delete(trackingId);
        }
    }

    // Add a method to check cached progress
    public async getUploadProgress(trackingId: string): Promise<UploadState | undefined> {
        const currentState = this.currentUploadState.get(trackingId);
        if (currentState) return currentState;
    }

    public getLastSuccessfulChunk(trackingId: string): number {
        return this.currentUploadState.get(trackingId)?.lastSuccessfulChunk ?? -1;
    }

    public getUploadedBytes(trackingId: string): number {
        return this.currentUploadState.get(trackingId)?.uploadedBytes ?? 0;
    }
        // Update initializeUploadState to remove cache
    private initializeUploadState(trackingId: string, blockBlobClient: BlockBlobClient): void {
        const newState: UploadState = {
            completedChunks: new Set(),
            lastSuccessfulChunk: -1,
            uploadedBytes: 0,
            blockIds: [],
            blockBlobClient: blockBlobClient,
            startTime: Date.now(),
            totalBytes: 0 // Add this line
        };

        this.currentUploadState.set(trackingId, newState);
    }

    private recordUploadMetrics(trackingId: string, remainingChunks: ChunkMetadata[]): void {
        monitoringManager.recordDashboardMetric({
            type: 'SYSTEM_HEALTH',
            timestamp: Date.now(),
            value: this.currentUploadState.size,
            metadata: {
                component: 'upload_system',
                category: 'file_processing',
                aggregationType: 'latest',
                uploadStats: {
                    activeUploads: this.currentUploadState.size,
                    queueSize: remainingChunks.length,
                    memoryUsage: process.memoryUsage().heapUsed,
                    chunkProgress: this.getUploadedBytes(trackingId)
                }
            }
        });
    }

    // Add this method to emit progress

        // Modify emitProgress to include enhanced metrics
    private emitProgress(
        trackingId: string,
        userId: string,
        file: any,
        chunks: ChunkMetadata[]
    ): void {
        const state = this.currentUploadState.get(trackingId);
        if (!state) return;

        const now = Date.now();
        const uploadDuration = now - state.startTime;
        const uploadSpeed = state.uploadedBytes / (uploadDuration / 1000); // bytes per second
        const remainingBytes = file.size - state.uploadedBytes;
        const estimatedTimeRemaining = remainingBytes / uploadSpeed;

        const event: EnhancedProgress = {
            trackingId,
            userId,
            progress: (state.completedChunks.size / chunks.length) * 100,
            chunksCompleted: state.completedChunks.size,
            totalChunks: chunks.length,
            uploadedBytes: state.uploadedBytes,
            totalBytes: file.size,
            status: state.uploadedBytes === file.size ? 'completed' : 'uploading',
            // Enhanced metrics
            estimatedTimeRemaining,
            uploadSpeed,
            serverLoad: process.memoryUsage().heapUsed / 1024 / 1024 // MB
        };

        this.emit(UPLOAD_WEBSOCKET.EVENTS.PROGRESS, event);
    }


    private async uploadWithChunking(
        file: any,
        blockBlobClient: BlockBlobClient,
        onProgress?: (progress: number) => void,
        options?: Partial<ChunkConfig>,
        trackingId?: string,
        resumeFrom?: number,
        userId?: string
    ): Promise<void> {
        const optimizedChunkSize = this.optimizeChunkSize(file.size);
        const chunks = this.calculateChunks(file.size, optimizedChunkSize);
        let leaseId: string | undefined;

        try {
            const config = { ...this.config, ...options };

            if (trackingId && !this.currentUploadState.has(trackingId)) {
                this.initializeUploadState(trackingId, blockBlobClient);
            }

            const state = trackingId ? this.currentUploadState.get(trackingId) : null;
            const startIndex = resumeFrom ?? 0;

            const remainingChunks = chunks.filter(chunk => 
                !state?.completedChunks.has(chunk.id) && chunk.id >= startIndex
            );

            // Check for existing lease first
            const leaseClient = blockBlobClient.getBlobLeaseClient();
            try {
                const properties = await blockBlobClient.getProperties();
                if (properties.leaseState === 'leased') {
                    monitoringManager.logger.info('Breaking existing lease', {
                        leaseState: properties.leaseState,
                        leaseStatus: properties.leaseStatus,
                    });

                    try {
                        await leaseClient.breakLease(0);
                        // Wait for lease to be fully broken
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        monitoringManager.logger.info('Lease broken successfully');
                    } catch (breakError) {
                        monitoringManager.logger.warn('Failed to break lease', {
                            error: breakError instanceof Error ? breakError.message : 'Unknown error'
                        });
                        // Continue anyway as the lease might have expired
                    }
                }
            } catch (error) {
                // Log but continue if we can't get properties
                monitoringManager.logger.debug('Blob does not exist yet or cannot get properties', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
            
            // Now acquire the lease
            leaseId = (await leaseClient.acquireLease(60)).leaseId;
            if (trackingId && state) {
                state.leaseId = leaseId;
            }

                // Execute the upload queue and get results
    const results = await this.executeUploadQueue(
        remainingChunks.map(chunk => () => this.uploadChunk(
            chunk,
            file,
            blockBlobClient,
            progress => onProgress?.(progress.progress),
            leaseId,
            trackingId,
            userId
        )),
        config.maxConcurrent
    );

    // Verify we have all required blockIds
    const blockIds = remainingChunks
        .sort((a, b) => a.id - b.id)
        .map((chunk, index) => results[index]);

    if (blockIds.length !== remainingChunks.length) {
        throw new Error('Missing blockIds after upload');
    }

    await blockBlobClient.commitBlockList(blockIds, {
        metadata: {
            originalName: file.originalFilename,
            contentType: file.mimetype,
            uploadTimestamp: new Date().toISOString(),
            resumeEnabled: 'true'
        },
        conditions: { leaseId }
    });
        } catch (error) {
            if (trackingId) {
                await this.cleanupFailedUpload(trackingId, blockBlobClient, leaseId);
            }
            throw error;
        } finally {
            if (leaseId) {
                const leaseClient = blockBlobClient.getBlobLeaseClient(leaseId);
                await leaseClient.releaseLease();
            }
            if (trackingId) {
                this.currentUploadState.delete(trackingId);
            }
            if (file.filepath && file.filepath.includes('temp')) {
                try {
                    await fs.promises.unlink(file.filepath);
                } catch (error) {
                    monitoringManager.logger.warn('Failed to cleanup temporary file', {
                        filepath: file.filepath,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
        }

        monitoringManager.metrics.recordMetric(
            MetricCategory.PERFORMANCE,
            'file_upload',
            'complete',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                fileSize: file.size,
                chunks: chunks.length,
                contentType: file.mimetype,
                resumed: !!resumeFrom
            }
        );
    }


    public async uploadWithChunkingV2(
    file: formidable.File,
    blockBlobClient: BlockBlobClient,
    uploadOptions: UploadOptions,
    chunkingOptions: ChunkingOptions
): Promise<void> {
    // Calculate optimized chunk size based on file size
    const optimizedChunkSize = this.optimizeChunkSize(file.size);

    // Merge optimized chunk size with provided options
    const enhancedChunkingOptions = {
        chunkSize: chunkingOptions.chunkSize || optimizedChunkSize, // Use optimized size as default
        maxRetries: chunkingOptions.maxRetries || CHUNKING_CONFIG.MAX_RETRIES,
        retryDelayBase: chunkingOptions.retryDelayBase || CHUNKING_CONFIG.RETRY_DELAY_BASE,
        maxConcurrent: this.calculateOptimalConcurrency(
            chunkingOptions.maxConcurrent || CHUNKING_CONFIG.MAX_CONCURRENT,
            file.size
        )
    };

    // Enhanced progress tracking
    const progressCallback = (progress: number) => {
        const state = this.currentUploadState.get(uploadOptions.trackingId);
        const now = Date.now();
        const uploadDuration = state ? now - state.startTime : 0;
        const uploadSpeed = state ? state.uploadedBytes / (uploadDuration / 1000) : 0;

        uploadOptions.onProgress(
            progress,
            this.getLastSuccessfulChunk(uploadOptions.trackingId),
            this.calculateChunks(file.size, enhancedChunkingOptions.chunkSize).length,
            this.getUploadedBytes(uploadOptions.trackingId)
        );
    };

    return this.uploadWithChunking(
        file,
        blockBlobClient,
        progressCallback,
        enhancedChunkingOptions,
        uploadOptions.trackingId,
        chunkingOptions.resumeFromChunk,
        uploadOptions.userId
    );
}

// Add this helper method
private calculateOptimalConcurrency(maxConcurrent: number, fileSize: number): number {
    // For very large files, increase concurrency
    if (fileSize > 1024 * 1024 * 1024) { // 1GB
        return Math.min(maxConcurrent * 2, 6); // Double but cap at 6
    }
    // For small files, reduce concurrency to avoid overhead
    if (fileSize < 50 * 1024 * 1024) { // 50MB
        return Math.max(1, Math.floor(maxConcurrent / 2));
    }
    return maxConcurrent;
}


private getUploadControl(trackingId: string) {
    if (!this.uploadControlState.has(trackingId)) {
        this.uploadControlState.set(trackingId, {
            lastRetryTimestamp: 0,
            retryCount: 0,
            isPaused: false,
            isCancelled: false
        });
    }
    return this.uploadControlState.get(trackingId)!;
}


    private async executeUploadQueue<T>(
    queue: (() => Promise<T>)[],
    maxConcurrent: number
): Promise<T[]> {
    const results: T[] = [];
    let activeUploads = 0;
    let queueIndex = 0;

    // Create promises array to properly handle results
    const promises: Promise<void>[] = [];

    while (queueIndex < queue.length || activeUploads > 0) {
        while (activeUploads < maxConcurrent && queueIndex < queue.length) {
            const currentIndex = queueIndex++;
            activeUploads++;

            // Create and store promise for each upload
            const promise = queue[currentIndex]()
                .then(result => {
                    results[currentIndex] = result;
                })
                .catch(error => {
                    // Handle error and ensure it's propagated
                    monitoringManager.logger.error(error, SystemError.CHUNK_UPLOAD_FAILED as ErrorType, {
                        chunkIndex: currentIndex,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    throw error; // Rethrow to be caught by Promise.all
                })
                .finally(() => {
                    activeUploads--;
                });

            promises.push(promise);
        }
        
        // Wait for some promises to complete before continuing
        if (activeUploads >= maxConcurrent || queueIndex >= queue.length) {
            try {
                await Promise.race(promises);
            } catch (error) {
                // If any promise fails, fail the entire upload
                throw error;
            }
        }
    }

    // Wait for all remaining promises
    try {
        await Promise.all(promises);
    } catch (error) {
        throw error;
    }

    // Verify all chunks were uploaded
    if (results.some(r => !r)) {
        throw new Error('Some chunks failed to upload');
    }

    return results;
}
}

export const chunkingService = ChunkingService.getInstance();

// Add WebSocket handler
export class UploadWebSocketHandler {
    private static instance: UploadWebSocketHandler;
    private wss: WebSocketServer;
    private connections = new Map<string, Set<WebSocket>>();

    private constructor(server: any) {
        this.wss = new WebSocketServer({ server });
        this.setupWebSocket();
        this.listenToChunkingService();
    }

    static getInstance(server: any): UploadWebSocketHandler {
        if (!this.instance) {
            this.instance = new UploadWebSocketHandler(server);
        }
        return this.instance;
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws: WebSocket, req: any) => {
            const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('userId');
            if (!userId) {
                ws.close(1008, 'No userId provided');
                return;
            }

            this.addConnection(userId, ws);

            ws.on('close', () => {
                this.removeConnection(userId, ws);
            });
        });
    }

    public close(callback?: () => void): void {
    try {
        this.connections.forEach((connections, userId) => {
            connections.forEach(ws => {
                ws.close();
            });
            this.connections.delete(userId);
        });
        this.wss.close(() => {
            console.log('WebSocket server closed successfully');
            callback?.();
        });
    } catch (error) {
        console.error('Error closing WebSocket server:', error);
        callback?.();
    }
}
    // HEY YOU!! THIS IS A METHOD THAT ALLOWS YOU TO LISTEN TO CHUNKING SERVICE EVENTS SO LIKE THAT NOTIFICAITON STUFF CAN BE SENT TO THE CLIENT MAKE COOL LOOKING PROGRESS BARS AND STUFF

    private listenToChunkingService() {
    chunkingService.on(UPLOAD_WEBSOCKET.EVENTS.PROGRESS, (event: UploadProgressEvent) => {
        this.notifyUser(event.userId, {
            type: UPLOAD_WEBSOCKET.EVENTS.PROGRESS,
            data: event
        });
    });
    }
    
    private addConnection(userId: string, ws: WebSocket) {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set());
        }
        this.connections.get(userId)!.add(ws);
    }

    private removeConnection(userId: string, ws: WebSocket) {
        const userConnections = this.connections.get(userId);
        if (userConnections) {
            userConnections.delete(ws);
            if (userConnections.size === 0) {
                this.connections.delete(userId);
            }
        }
    }

    private notifyUser(userId: string, message: any) {
        const userConnections = this.connections.get(userId);
        if (userConnections) {
            const messageStr = JSON.stringify(message);
            userConnections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(messageStr);
                }
            });
        }
    }
}