// src/services/ChunkProcessingService.ts
import { CHUNK_CONFIG } from '../constants/aiConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogLevel, LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';
import { SystemContext } from '@/MonitoringSystem/types/logging';
import { 
  SystemError,
  BusinessError,
  IntegrationError
} from '@/MonitoringSystem/constants/errors';
import { HttpStatus } from '@/MonitoringSystem/constants/httpStatus';


// At the top of ChunkProcessingService.ts, update the interface:
interface ChunkSystemContext extends SystemContext {
  component: string;
}

// Then update the SYSTEM_CONTEXT constant:
const SYSTEM_CONTEXT: ChunkSystemContext = {
  component: 'ChunkProcessingService',
  systemId: process.env.SYSTEM_ID || 'chunk-processing',
  systemName: 'ChunkProcessingService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
  version: process.env.SYSTEM_VERSION || '1.0',
  metadata: {
    maxChunkSize: CHUNK_CONFIG.MAX_CHUNK_SIZE,
    maxRetries: CHUNK_CONFIG.MAX_RETRIES,
    service: 'chunk-processing'
  }
};
interface ChunkValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    size: number;
    maxSize: number;
    minSize: number;
    strategy?: string;
  };
}

interface ErrorTracker {
  count: number;
  lastError?: Error;
  timestamp: number;
}

export class ChunkProcessingService {
  private static instance: ChunkProcessingService;
  private errorTracker: ErrorTracker = {
    count: 0,
    timestamp: Date.now()
  };

  private logger = monitoringManager.logger;

  private constructor() {
    this.logger.info('ChunkProcessingService initialized', {
      category: LogCategory.SYSTEM,
      pattern: LOG_PATTERNS.SYSTEM,
      maxChunkSize: CHUNK_CONFIG.MAX_CHUNK_SIZE,
      maxRetries: CHUNK_CONFIG.MAX_RETRIES
    });
  }
  
  public static getInstance(): ChunkProcessingService {
    if (!ChunkProcessingService.instance) {
      ChunkProcessingService.instance = new ChunkProcessingService();
    }
    return ChunkProcessingService.instance;
  }

  private resetErrorCount(): void {
    if (Date.now() - this.errorTracker.timestamp > CHUNK_CONFIG.TIMEOUT) {
      const previousCount = this.errorTracker.count;
      this.errorTracker = {
        count: 0,
        timestamp: Date.now()
      };

      if (previousCount > 0) {
        this.logger.info('Error count reset', {
          category: LogCategory.SYSTEM,
          pattern: LOG_PATTERNS.SYSTEM,
          previousCount,
          timeoutMs: CHUNK_CONFIG.TIMEOUT
        });
      }
    }
  }

  // Then in trackError, use it correctly:
private trackError(error: Error): void {
  this.resetErrorCount();
  this.errorTracker.count++;
  this.errorTracker.lastError = error;
  this.errorTracker.timestamp = Date.now();

  if (this.errorTracker.count >= CHUNK_CONFIG.MAX_ERROR_THRESHOLD) {
    const appError = monitoringManager.error.createError(
      'system',
      SystemError.HIGH_ERROR_RATE,
      'Error threshold exceeded in chunk processing',
      {
        errorCount: this.errorTracker.count,
        lastError: error.message,
        metadata: {
          component: SYSTEM_CONTEXT.component,
          threshold: CHUNK_CONFIG.MAX_ERROR_THRESHOLD
        }
      }
    );

    monitoringManager.logger.error(
      error,
      SystemError.HIGH_ERROR_RATE,
      {
        category: LogCategory.SYSTEM,
        pattern: LOG_PATTERNS.SYSTEM,
        metadata: {
          errorCount: this.errorTracker.count,
          threshold: CHUNK_CONFIG.MAX_ERROR_THRESHOLD,
          component: SYSTEM_CONTEXT.component
        }
      }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'error',
      'threshold_exceeded',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorCount: this.errorTracker.count,
        errorType: SystemError.HIGH_ERROR_RATE,
        serviceComponent: SYSTEM_CONTEXT.component
      }
    );

    throw appError;
  }
}

  private findNaturalBreak(text: string, around: number): number {
    if (CHUNK_CONFIG.SPLIT_STRATEGY !== 'sentence') {
      return around;
    }

    const searchWindow = CHUNK_CONFIG.OVERLAP_SIZE;
    const start = Math.max(0, around - searchWindow);
    const end = Math.min(text.length, around + searchWindow);
    const searchText = text.slice(start, end);

    const breakPoints = ['. ', '! ', '? ', '\n\n'];
    let bestBreak = -1;

    for (const breakPoint of breakPoints) {
      const index = searchText.lastIndexOf(breakPoint);
      if (index > bestBreak) {
        bestBreak = index;
      }
    }

    const breakPoint = bestBreak === -1 ? around : start + bestBreak + 2;

    if (CHUNK_CONFIG.LOG_LEVEL === LogLevel.DEBUG.toString()) {
      this.logger.debug('Natural break found', {
        category: LogCategory.PERFORMANCE,
        pattern: LOG_PATTERNS.SYSTEM,
        searchWindow,
        foundBreak: bestBreak !== -1,
        position: breakPoint
      });
    }

    return breakPoint;
  }

  public validateChunk(chunk: string): ChunkValidationResult {
    const startTime = Date.now();
    try {
      if (!chunk) {
        const result = {
          isValid: false,
          error: 'Chunk is empty',
          details: {
            size: 0,
            maxSize: CHUNK_CONFIG.MAX_CHUNK_SIZE,
            minSize: CHUNK_CONFIG.MIN_CHUNK_SIZE,
            strategy: CHUNK_CONFIG.SPLIT_STRATEGY
          }
        };

        this.logger.warn('Empty chunk validation attempt', {
          category: LogCategory.BUSINESS,
          pattern: LOG_PATTERNS.BUSINESS,
          component: SYSTEM_CONTEXT
        });

        throw monitoringManager.error.createError(
          'business',
          BusinessError.VALIDATION_FAILED,
          'Empty chunk provided',
          { component: SYSTEM_CONTEXT}
        );
      }

      const isValid = chunk.length >= CHUNK_CONFIG.MIN_CHUNK_SIZE && 
                     chunk.length <= CHUNK_CONFIG.MAX_CHUNK_SIZE;

      const validationResult = {
        isValid,
        details: {
          size: chunk.length,
          maxSize: CHUNK_CONFIG.MAX_CHUNK_SIZE,
          minSize: CHUNK_CONFIG.MIN_CHUNK_SIZE,
          strategy: CHUNK_CONFIG.SPLIT_STRATEGY
        }
      };

      if (CHUNK_CONFIG.LOG_LEVEL === LogLevel.DEBUG.toString()) {
        this.logger.debug('Chunk validation', {
          category: LogCategory.PERFORMANCE,
          pattern: LOG_PATTERNS.SYSTEM,
          chunkSize: chunk.length,
          isValid,
          strategy: CHUNK_CONFIG.SPLIT_STRATEGY,
          duration: Date.now() - startTime
        });
      }

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'chunk',
        'validation',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          chunkSize: chunk.length,
          isValid,
          duration: Date.now() - startTime,
          strategy: CHUNK_CONFIG.SPLIT_STRATEGY,
          reason: isValid ? 'success' : 'size_constraint',
          component: SYSTEM_CONTEXT
        }
      );

      return validationResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof Error) {
        this.trackError(error);
      }

      throw monitoringManager.error.createError(
        'system',
        SystemError.PROCESSING_CHUNK_VALIDATION_FAILED,
        'Failed to validate chunk',
        { 
          error, 
          errorCount: this.errorTracker.count,
          duration,
          chunkLength: chunk?.length,
          maxSize: CHUNK_CONFIG.MAX_CHUNK_SIZE,
          minSize: CHUNK_CONFIG.MIN_CHUNK_SIZE
        }
      );
    }
  }

  public optimizeChunks(text: string): string[] {
    const startTime = Date.now();
    const chunks: string[] = [];
    
    try {
      if (!text) {
        throw monitoringManager.error.createError(
          'business',
          BusinessError.VALIDATION_FAILED,
          'Empty text provided for optimization',
          { component: SYSTEM_CONTEXT }
        );
      }

      let currentIndex = 0;
      let errorCount = 0;

      while (currentIndex < text.length && chunks.length < CHUNK_CONFIG.MAX_CHUNKS) {
        let chunkEnd = Math.min(
          currentIndex + CHUNK_CONFIG.MAX_CHUNK_SIZE,
          text.length
        );
        
        if (chunkEnd < text.length) {
          chunkEnd = this.findNaturalBreak(text, chunkEnd);
        }

        const chunk = text.slice(currentIndex, chunkEnd);
        const validationResult = this.validateChunk(chunk);

        if (validationResult.isValid) {
          chunks.push(chunk);
          currentIndex = chunkEnd - CHUNK_CONFIG.OVERLAP_SIZE;
        } else {
          errorCount++;
          if (errorCount >= CHUNK_CONFIG.MAX_ERROR_THRESHOLD) {
            throw monitoringManager.error.createError(
              'system',
              SystemError.PROCESSING_CHUNK_FAILED,
              'Maximum error threshold reached during optimization',
              { 
                errorCount,
                maxThreshold: CHUNK_CONFIG.MAX_ERROR_THRESHOLD,
                processedChunks: chunks.length
              }
            );
          }
          
          const adjustedEnd = this.findNaturalBreak(
            text, 
            currentIndex + Math.floor(CHUNK_CONFIG.MAX_CHUNK_SIZE / 2)
          );
          chunks.push(text.slice(currentIndex, adjustedEnd));
          currentIndex = adjustedEnd;
        }
      }

      const duration = Date.now() - startTime;

      if (chunks.length >= CHUNK_CONFIG.MAX_CHUNKS) {
        this.logger.warn('Maximum chunks limit reached', {
          category: LogCategory.BUSINESS,
          pattern: LOG_PATTERNS.BUSINESS,
          maxChunks: CHUNK_CONFIG.MAX_CHUNKS,
          inputLength: text.length
        });
      }

      return chunks;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof Error) {
        this.trackError(error);
      }

      throw monitoringManager.error.createError(
        'system',
        SystemError.PROCESSING_CHUNK_FAILED,
        'Failed to optimize chunks',
        { 
          error, 
          textLength: text?.length,
          errorCount: this.errorTracker.count,
          chunksProcessed: chunks.length,
          duration
        }
      );
    }
  }

  public async validateAndOptimizeChunk(chunk: string): Promise<string> {
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount < CHUNK_CONFIG.MAX_RETRIES) {
      try {
        const validationResult = this.validateChunk(chunk);
        if (validationResult.isValid) {
          return chunk;
        }

        if (retryCount > 0) {
          this.logger.warn('Retrying chunk optimization', {
            category: LogCategory.PERFORMANCE,
            pattern: LOG_PATTERNS.SYSTEM,
            retryCount,
            chunkSize: chunk.length,
            maxRetries: CHUNK_CONFIG.MAX_RETRIES
          });
        }

        const optimizedChunks = this.optimizeChunks(chunk);
        
        if (!optimizedChunks.length) {
          throw monitoringManager.error.createError(
            'system',
            SystemError.PROCESSING_CHUNK_FAILED,
            'Optimization produced no valid chunks',
            { originalSize: chunk.length }
          );
        }

        return optimizedChunks[0];

      } catch (error) {
        retryCount++;
        if (error instanceof Error) {
          this.trackError(error);
        }
        
        if (retryCount >= CHUNK_CONFIG.MAX_RETRIES) {
          throw monitoringManager.error.createError(
            'system',
            SystemError.SERVER_TOO_MANY_REQUESTS,
            'Maximum retry attempts reached',
            { 
              retryCount,
              maxRetries: CHUNK_CONFIG.MAX_RETRIES,
              chunkSize: chunk.length,
              duration: Date.now() - startTime
            }
          );
        }

        await new Promise(resolve => setTimeout(resolve, CHUNK_CONFIG.RETRY_DELAY));
      }
    }

    throw monitoringManager.error.createError(
      'system',
      SystemError.PROCESSING_CHUNK_FAILED,
      'Failed to process chunk after maximum retries',
      { 
        maxRetries: CHUNK_CONFIG.MAX_RETRIES,
        duration: Date.now() - startTime,
        chunkSize: chunk.length
      }
    );
  }

  public async destroy(): Promise<void> {
    try {
      await monitoringManager.flush();
      this.logger.info('ChunkProcessingService destroyed', {
        category: LogCategory.SYSTEM,
        pattern: LOG_PATTERNS.SYSTEM,
        component: SYSTEM_CONTEXT
      });
    } catch (error) {
      throw monitoringManager.error.createError(
        'system',
        SystemError.LOG_FLUSH_FAILED,
        'Failed to flush logs during service destruction',
        { error }
      );
    }
  }
}

export const chunkProcessingService = ChunkProcessingService.getInstance();
