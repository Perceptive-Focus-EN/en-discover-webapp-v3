import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { BlockBlobClient } from '@azure/storage-blob';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';
import fs from 'fs';
import WebSocket, { Server as WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import formidable from 'formidable';
import {
    ChunkingOptions,
    ChunkProgress,
    ChunkUploadResult,
    UploadCleanupMetadata
} from '@/UploadingSystem/types/chunking';

import { ChunkState, UploadState, } from '@/UploadingSystem/types/state';
import {
    EnhancedProgress, 
UploadProgress, 
} from '@/UploadingSystem/types/progress';
import {UploadOptions} from '@/UploadingSystem/types/upload';
import { 
    CHUNKING_CONFIG, 
    UPLOAD_SETTINGS, 
    UPLOAD_STATUS, 
    UPLOAD_WEBSOCKET 
} from '../constants/uploadConstants';

export class ChunkingService extends EventEmitter {
    private static instance: ChunkingService | null = null;
    private readonly config: ChunkingOptions;
    private currentUploadState: Map<string, UploadState> = new Map();
    private uploadControlState = new Map<string, {
        retryCount: number;
        lastRetryTimestamp: number;
        isPaused: boolean;
        isCancelled: boolean;
    }>();

    private constructor() {
        super();
        this.config = {
            chunkSize: UPLOAD_SETTINGS.CHUNK_SIZE,
            maxRetries: UPLOAD_SETTINGS.MAX_RETRIES,
            retryDelayBase: UPLOAD_SETTINGS.RETRY_DELAY_BASE,
            maxConcurrent: UPLOAD_SETTINGS.MAX_CONCURRENT_UPLOADS
        };
        setInterval(() => this.performPeriodicCleanup(), 5 * 60 * 1000);
    }

    static getInstance(): ChunkingService {
        if (!this.instance) {
            this.instance = new ChunkingService();
        }
        return this.instance;
    }

    private optimizeChunkSize(fileSize: number): number {
        const baseSize = CHUNKING_CONFIG.CHUNK_SIZE;
        return fileSize > 1024 * 1024 * 1024 ? baseSize * 4 : baseSize;
    }

    private calculateOptimalConcurrency(maxConcurrent: number, fileSize: number): number {
        if (fileSize > 1024 * 1024 * 1024) {
            return Math.min(maxConcurrent * 2, 6);
        }
        if (fileSize < 50 * 1024 * 1024) {
            return Math.max(1, Math.floor(maxConcurrent / 2));
        }
        return maxConcurrent;
    }

    protected async performPeriodicCleanup(): Promise<void> {
        const now = Date.now();
        const staleTimeout = 30 * 60 * 1000;
        for (const [trackingId, state] of this.currentUploadState.entries()) {
            if (now - state.metadata.startTime > staleTimeout) {
                await this.cleanupUploadState({ 
                    trackingId, 
                    reason: 'cancellation', 
                    finalState: state 
                });
            }
        }
    }

    private calculateChunks(fileSize: number, chunkSize: number): ChunkState[] {
        const chunks: ChunkState[] = [];
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
                attempts: 0,
                status: 'pending'
            });
            position += currentChunkSize;
        }
        return chunks;
    }

    protected async cleanupUploadState(metadata: UploadCleanupMetadata): Promise<void> {
        const { trackingId, reason, error, finalState } = metadata;
        const state = finalState || this.currentUploadState.get(trackingId);
        if (!state) return;

        try {
            if (state.blockBlobClient && reason !== 'completion') {
                await this.cleanupFailedUpload(
                    trackingId, 
                    state.blockBlobClient, 
                    state.control.leaseId
                );
            }

            if (state.control.leaseId) {
                const leaseClient = state.blockBlobClient.getBlobLeaseClient(state.control.leaseId);
                await leaseClient.releaseLease();
            }

            if (state.metadata.tempFilePath) {
                await fs.promises.unlink(state.metadata.tempFilePath);
            }

            this.currentUploadState.delete(trackingId);
            this.uploadControlState.delete(trackingId);

            this.emit(UPLOAD_WEBSOCKET.EVENTS.CLEANUP, {
                trackingId,
                reason,
                error: error?.message,
                finalState: {
                    uploadedBytes: state.progress.uploadedBytes,
                    totalBytes: state.progress.totalBytes,
                    chunksCompleted: state.progress.chunksCompleted
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
        failedChunks: ChunkState[],
        file: formidable.File,
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
        chunk: ChunkState,
        file: formidable.File,
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
                    progress => this.emitProgress(trackingId!, userId!, file),
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

    private async readChunkToBuffer(filePath: string, start: number, size: number): Promise<Buffer> {
        const buffer = Buffer.alloc(size);
        const fileHandle = await fs.promises.open(filePath, 'r');
        try {
            await fileHandle.read(buffer, 0, size, start);
        } finally {
            await fileHandle.close();
        }
        return buffer;
    }

    private async lockUploadState(trackingId: string): Promise<void> {
        while (this.currentUploadState.get(trackingId)?.control.locked) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const state = this.currentUploadState.get(trackingId);
        if (state) {
            state.control.locked = true;
        }
    }

    private releaseUploadState(trackingId: string): void {
        const state = this.currentUploadState.get(trackingId);
        if (state) {
            state.control.locked = false;
        }
    }

    private async cleanupFailedUpload(trackingId: string, blockBlobClient: BlockBlobClient, leaseId?: string): Promise<void> {
        try {
            if (leaseId) {
                const leaseClient = blockBlobClient.getBlobLeaseClient(leaseId);
                await leaseClient.releaseLease();
            }
            this.currentUploadState.delete(trackingId);
            this.uploadControlState.delete(trackingId);
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.CHUNK_CLEANUP_FAILED, { trackingId });
        }
    }

    private async uploadChunk(
        chunk: ChunkState,
        file: formidable.File,
        blockBlobClient: BlockBlobClient,
        onProgress: (progress: ChunkProgress) => void,
        leaseId?: string,
        trackingId?: string,
        userId?: string
    ): Promise<string> {
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

        try {
            onProgress({
                chunkId,
                progress: 0,
                status: 'uploading'
            });

            const buffer = await this.readChunkToBuffer(file.filepath, chunk.start, chunk.size);

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

            if (trackingId && userId) {
                await this.updateUploadProgress(trackingId, chunk.id, encodedChunkId, chunk.size);
                this.emitProgress(trackingId, userId, file);
            }

            return encodedChunkId;

        } catch (error) {
            if ((error as any)?.code === 'LeaseIdMissing') {
                throw monitoringManager.error.createError(
                    'business',
                    'LEASE_REQUIRED',
                    'Lease required for upload'
                );
            }
            throw error;
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
                state.chunks.set(chunkId, {
                    ...state.chunks.get(chunkId)!,
                    status: 'completed'
                });
                state.progress.chunksCompleted += 1;
                state.progress.uploadedBytes += chunkSize;
                state.blockIds[chunkId] = blockId;
            }
        } finally {
            this.releaseUploadState(trackingId);
        }
    }

    private async executeUploadQueue<T>(tasks: (() => Promise<T>)[], maxConcurrent: number): Promise<T[]> {
        const results: T[] = [];
        const executing: Promise<void>[] = [];

        for (const task of tasks) {
            const p = task().then(result => {
                results.push(result);
                return;
            });
            executing.push(p);

            if (executing.length >= maxConcurrent) {
                await Promise.race(executing);
                await Promise.race(executing);
                executing.splice(0, 1);
            }
        }

        await Promise.all(executing);
        return results;
    }

    private async uploadWithChunking(
    file: formidable.File,
    blockBlobClient: BlockBlobClient,
    onProgress?: (progress: number) => void,
    options?: Partial<ChunkingOptions>,
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
            !state?.chunks.has(chunk.id) && chunk.id >= startIndex
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
                }
            }
        } catch (error) {
            monitoringManager.logger.debug('Blob does not exist yet or cannot get properties', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        
        // Now acquire the lease
        leaseId = (await leaseClient.acquireLease(60)).leaseId;
        if (trackingId && state) {
            state.control.leaseId = leaseId;
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
                originalName: file.originalFilename ?? 'unknown',
                contentType: file.mimetype ?? 'application/octet-stream',
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

    // Enhanced V2 method that calls the base method
    public async uploadWithChunkingV2(
    file: formidable.File,
    blockBlobClient: BlockBlobClient,
    uploadOptions: UploadOptions,
    chunkingOptions: ChunkingOptions
): Promise<void> {
    const optimizedChunkSize = this.optimizeChunkSize(file.size);
    const enhancedChunkingOptions = {
        chunkSize: chunkingOptions.chunkSize || optimizedChunkSize,
        maxRetries: chunkingOptions.maxRetries || CHUNKING_CONFIG.MAX_RETRIES,
        retryDelayBase: chunkingOptions.retryDelayBase || CHUNKING_CONFIG.RETRY_DELAY_BASE,
        maxConcurrent: this.calculateOptimalConcurrency(
            chunkingOptions.maxConcurrent || CHUNKING_CONFIG.MAX_CONCURRENT,
            file.size
        )
    };

    const progressCallback = (progress: number) => {
        const state = this.currentUploadState.get(uploadOptions.trackingId);
        const now = Date.now();
        const uploadDuration = state ? now - state.metadata.startTime : 0;
        const uploadSpeed = state ? state.progress.uploadedBytes / (uploadDuration / 1000) : 0;

        uploadOptions.onProgress(
            progress,
            this.getLastSuccessfulChunk(uploadOptions.trackingId),
            this.calculateChunks(file.size, enhancedChunkingOptions.chunkSize).length,
            this.getUploadedBytes(uploadOptions.trackingId)
        );
    };

    // Call the base uploadWithChunking method instead
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
                await this.cleanupFailedUpload(
                    uploadId, 
                    state.blockBlobClient, 
                    state.control.leaseId
                );
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

    // Helper methods for state access
    public async getUploadProgress(trackingId: string): Promise<UploadState | undefined> {
        return this.currentUploadState.get(trackingId);
    }

    public getLastSuccessfulChunk(trackingId: string): number {
        const state = this.currentUploadState.get(trackingId);
        return state ? Math.max(...Array.from(state.chunks.keys())) : -1;
    }

    public getUploadedBytes(trackingId: string): number {
        return this.currentUploadState.get(trackingId)?.progress.uploadedBytes ?? 0;
    }

    private initializeUploadState(trackingId: string, blockBlobClient: BlockBlobClient): void {
        const newState: UploadState = {
            chunks: new Map(),
            control: {
                isPaused: false,
                isCancelled: false,
                retryCount: 0,
                lastRetryTimestamp: 0,
                locked: false,
                leaseId: undefined
            },
            metadata: {
                fileName: '',
                fileSize: 0,
                mimeType: '',
                category: 'other',
                accessLevel: 'private',
                retention: 'temporary',
                startTime: Date.now(),
                tempFilePath: undefined
            },
            progress: {
                trackingId,
                progress: 0,
                chunksCompleted: 0,
                totalChunks: 0,
                uploadedBytes: 0,
                totalBytes: 0,
                status: UPLOAD_STATUS.INITIALIZING
            },
            blockBlobClient,
            blockIds: []
        };

        this.currentUploadState.set(trackingId, newState);
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

    private emitProgress(trackingId: string, userId: string, file: formidable.File): void {
        const state = this.currentUploadState.get(trackingId);
        if (!state) return;

        const now = Date.now();
        const uploadDuration = now - state.metadata.startTime;
        const uploadSpeed = state.progress.uploadedBytes / (uploadDuration / 1000);
        const remainingBytes = file.size - state.progress.uploadedBytes;
        const estimatedTimeRemaining = uploadSpeed > 0 ? remainingBytes / uploadSpeed : 0;

        const event: EnhancedProgress = {
            trackingId,
            userId,
            progress: (state.progress.uploadedBytes / state.metadata.fileSize) * 100,
            chunksCompleted: state.progress.chunksCompleted,
            totalChunks: state.progress.totalChunks,
            uploadedBytes: state.progress.uploadedBytes,
            totalBytes: state.metadata.fileSize,
            status: state.progress.uploadedBytes === state.metadata.fileSize 
                ? UPLOAD_STATUS.COMPLETED 
                : UPLOAD_STATUS.UPLOADING,
            estimatedTimeRemaining,
            uploadSpeed,
            serverLoad: process.memoryUsage().heapUsed / 1024 / 1024,
            timestamp: Date.now()
        };

        this.emit(UPLOAD_WEBSOCKET.EVENTS.PROGRESS, event);
    }
}


// WebSocket Handler
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
            ws.on('close', () => this.removeConnection(userId, ws));
        });
    }

    private listenToChunkingService() {
        const chunkingService = ChunkingService.getInstance();
        
        chunkingService.on(UPLOAD_WEBSOCKET.EVENTS.PROGRESS, (event: UploadProgress) => {
            this.notifyUser(event.userId, {
                type: UPLOAD_WEBSOCKET.EVENTS.PROGRESS,
                data: event
            });
        });

        chunkingService.on(UPLOAD_WEBSOCKET.EVENTS.CLEANUP, (event) => {
            this.notifyUser(event.trackingId, {
                type: UPLOAD_WEBSOCKET.EVENTS.CLEANUP,
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

    public close(callback?: () => void): void {
        try {
            this.connections.forEach((connections) => {
                connections.forEach(ws => ws.close());
            });
            this.connections.clear();
            this.wss.close(() => {
                console.log('WebSocket server closed successfully');
                callback?.();
            });
        } catch (error) {
            console.error('Error closing WebSocket server:', error);
            callback?.();
        }
    }
}

// Export singleton instance
export const chunkingService = ChunkingService.getInstance();