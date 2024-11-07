// src/services/ChunkingService.ts

import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { UPLOAD_SETTINGS } from '../../../constants/uploadConstants';
import { BlockBlobClient } from '@azure/storage-blob';
import { Readable } from 'stream';

interface ChunkConfig {
  chunkSize: number;
  maxRetries: number;
  retryDelayBase: number;
  maxConcurrent: number;
}

interface ChunkMetadata {
  id: number;
  start: number;
  end: number;
  size: number;
  etag?: string;
  attempts: number;
}

interface ChunkProgress {
  chunkId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface UploadState {
  completedChunks: Set<number>;
  lastSuccessfulChunk: number;
  uploadedBytes: number;
  blockIds: string[];
}

export class ChunkingService {
  private static instance: ChunkingService | null = null;
  private readonly config: ChunkConfig;
  private currentUploadState: Map<string, UploadState> = new Map();

  private constructor() {
    this.config = {
      chunkSize: UPLOAD_SETTINGS.CHUNK_SIZE,
      maxRetries: UPLOAD_SETTINGS.MAX_RETRIES,
      retryDelayBase: UPLOAD_SETTINGS.RETRY_DELAY_BASE,
      maxConcurrent: UPLOAD_SETTINGS.MAX_CONCURRENT_UPLOADS
    };
  }

  static getInstance(): ChunkingService {
    if (!this.instance) {
      this.instance = new ChunkingService();
    }
    return this.instance;
  }

  private calculateChunks(fileSize: number): ChunkMetadata[] {
    const chunks: ChunkMetadata[] = [];
    let position = 0;
    let index = 0;

    while (position < fileSize) {
      const chunkSize = Math.min(this.config.chunkSize, fileSize - position);
      chunks.push({
        id: index++,
        start: position,
        end: position + chunkSize,
        size: chunkSize,
        attempts: 0
      });
      position += chunkSize;
    }

    return chunks;
  }

  private async uploadChunk(
    chunk: ChunkMetadata,
    file: any,
    blockBlobClient: BlockBlobClient,
    onProgress: (progress: ChunkProgress) => void
  ): Promise<string> {
    const chunkId = `block-${chunk.id.toString().padStart(6, '0')}`;
    const encodedChunkId = Buffer.from(chunkId).toString('base64');

    while (chunk.attempts < this.config.maxRetries) {
      try {
        onProgress({
          chunkId,
          progress: 0,
          status: 'uploading'
        });

        const buffer = Buffer.alloc(chunk.size);
        await new Promise<void>((resolve, reject) => {
          const stream = Readable.from(file.filepath);
          const data = stream.read();
          data.copy(buffer, 0, chunk.start, chunk.start + chunk.size);
          stream.on('end', () => resolve());
          stream.on('error', reject);
        });

        await blockBlobClient.stageBlock(encodedChunkId, buffer, buffer.length);

        onProgress({
          chunkId,
          progress: 100,
          status: 'completed'
        });

        monitoringManager.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          'chunk_upload',
          'success',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            chunkId,
            size: chunk.size,
            attempts: chunk.attempts + 1
          }
        );

        return encodedChunkId;

      } catch (error) {
        chunk.attempts++;

        onProgress({
          chunkId,
          progress: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        if (chunk.attempts === this.config.maxRetries) {
          monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'chunk_upload',
            'failure',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
              chunkId,
              error: error instanceof Error ? error.message : 'Unknown error',
              attempts: chunk.attempts
            }
          );
          throw error;
        }

        const delay = Math.min(
          this.config.retryDelayBase * Math.pow(2, chunk.attempts) + Math.random() * 1000,
          30000
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Failed to upload chunk after ${this.config.maxRetries} attempts`);
  }

  public getLastSuccessfulChunk(trackingId: string): number {
    return this.currentUploadState.get(trackingId)?.lastSuccessfulChunk ?? -1;
  }

  public getUploadedBytes(trackingId: string): number {
    return this.currentUploadState.get(trackingId)?.uploadedBytes ?? 0;
  }

  private initializeUploadState(trackingId: string): void {
    this.currentUploadState.set(trackingId, {
      completedChunks: new Set(),
      lastSuccessfulChunk: -1,
      uploadedBytes: 0,
      blockIds: []
    });
  }

  private updateUploadProgress(
    trackingId: string, 
    chunkId: number, 
    blockId: string, 
    chunkSize: number
  ): void {
    const state = this.currentUploadState.get(trackingId);
    if (state) {
      state.completedChunks.add(chunkId);
      state.lastSuccessfulChunk = chunkId;
      state.uploadedBytes += chunkSize;
      state.blockIds[chunkId] = blockId;
    }
  }

  public async uploadWithChunking(
    file: any,
    blockBlobClient: BlockBlobClient,
    onProgress?: (progress: number) => void,
    options?: Partial<ChunkConfig>,
    trackingId?: string,
    resumeFrom?: number
  ): Promise<void> {
    const config = { ...this.config, ...options };
    const chunks = this.calculateChunks(file.size);
    
    if (trackingId) {
      if (!this.currentUploadState.has(trackingId)) {
        this.initializeUploadState(trackingId);
      }
    }

    const state = trackingId ? this.currentUploadState.get(trackingId) : null;
    let startIndex = resumeFrom ?? 0;

    const remainingChunks = chunks.filter(chunk => 
      !state?.completedChunks.has(chunk.id) && chunk.id >= startIndex
    );

    const uploadQueue = remainingChunks.map(chunk => async () => {
      try {
        const blockId = await this.uploadChunk(chunk, file, blockBlobClient, progress => {
          if (progress.status === 'completed' && trackingId) {
            this.updateUploadProgress(trackingId, chunk.id, blockId, chunk.size);
            const totalProgress = (state?.uploadedBytes ?? 0) / file.size * 100;
            onProgress?.(Math.min(totalProgress, 100));
          }
        });
        return { chunkId: chunk.id, blockId };
      } catch (error) {
        throw monitoringManager.error.createError(
          'system',
          'CHUNK_UPLOAD_FAILED',
          'Failed to upload chunk',
          {
            chunkId: chunk.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        );
      }
    });

    let activeUploads = 0;
    let queueIndex = 0;

    while (queueIndex < uploadQueue.length || activeUploads > 0) {
      while (activeUploads < config.maxConcurrent && queueIndex < uploadQueue.length) {
        activeUploads++;
        const upload = uploadQueue[queueIndex++]();
        upload.finally(() => activeUploads--);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const finalBlockIds = state?.blockIds ?? [];
    
    await blockBlobClient.commitBlockList(finalBlockIds, {
      metadata: {
        originalName: file.originalFilename,
        contentType: file.mimetype,
        uploadTimestamp: new Date().toISOString(),
        resumeEnabled: 'true'
      }
    });

    if (trackingId) {
      this.currentUploadState.delete(trackingId);
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
}

export const chunkingService = ChunkingService.getInstance();