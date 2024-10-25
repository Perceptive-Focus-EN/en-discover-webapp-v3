// src/lib/api_s/chunkProcessing.ts
import { generateResponse } from './openAIApiService';
import { api } from '../axiosSetup';
import { CHUNK_CONFIG } from '../../components/AI/constants/aiConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface GenerateResponseProps {
  userInput: string;
  context?: string[];
}

interface ChunkUploadResponse {
  message: string;
  chunkId: string;
  processingTime?: number;
  requestId?: string;
}

class ChunkProcessingError extends Error {
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly requestId?: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string, 
    retryable: boolean, 
    statusCode?: number, 
    requestId?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ChunkProcessingError';
    this.retryable = retryable;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.metadata = metadata;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const uploadChunk = async (
  chunk: string, 
  retryCount: number = 0
): Promise<ChunkUploadResponse> => {
  const startTime = Date.now();
  const formData = new FormData();
  formData.append('chunk', new Blob([chunk], { type: 'text/plain' }));

  try {
    const response = await api.post<ChunkUploadResponse>(
      '/api/chunks/text',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: CHUNK_CONFIG.TIMEOUT
      }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'chunk',
      'upload_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        chunkSize: chunk.length,
        requestId: response.requestId,
        success: true
      }
    );

    return response;
  } catch (error) {
    const statusCode = error.response?.status;
    const isRetryable = statusCode ? statusCode >= 500 : false;
    const requestId = error.response?.data?.requestId;

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'chunk',
      'upload_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: 'network',
        statusCode,
        retryCount,
        retryable: isRetryable,
        requestId
      }
    );

    if (isRetryable && retryCount < CHUNK_CONFIG.MAX_RETRIES) {
      await sleep(CHUNK_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
      return uploadChunk(chunk, retryCount + 1);
    }

    throw new ChunkProcessingError(
      `Failed to upload chunk: ${error.message}`,
      isRetryable,
      statusCode,
      requestId,
      {
        chunkSize: chunk.length,
        retryCount,
        duration: Date.now() - startTime
      }
    );
  }
};

const buildPrompt = (userInput: string, context: string[] = []): string => {
  const startTime = Date.now();
  try {
    let fullPrompt = '';
    if (context.length > 0) {
      const recentContext = context.slice(-CHUNK_CONFIG.MAX_CONTEXT_LENGTH);
      fullPrompt += "Previous conversation:\n" + recentContext.join("\n") + "\n\n";
    }
    fullPrompt += `User: ${userInput}\n\nAssistant: `;

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'prompt',
      'building_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        contextLength: context.length,
        promptLength: fullPrompt.length
      }
    );

    return fullPrompt;
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'prompt',
      'building_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown'
      }
    );
    throw error;
  }
};

class ChunkProcessingService {
  static optimizeChunks(text: string): string[] {
    const startTime = Date.now();
    try {
      const chunks: string[] = [];
      let currentIndex = 0;

      while (currentIndex < text.length) {
        let chunkEnd = Math.min(
          currentIndex + CHUNK_CONFIG.MAX_CHUNK_SIZE,
          text.length
        );

        // Find natural break point
        if (chunkEnd < text.length) {
          const nextPeriod = text.indexOf('.', chunkEnd - 100);
          if (nextPeriod !== -1 && nextPeriod - chunkEnd < 100) {
            chunkEnd = nextPeriod + 1;
          }
        }

        chunks.push(text.slice(currentIndex, chunkEnd));
        currentIndex = chunkEnd;
      }

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'chunk',
        'optimization_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          inputLength: text.length,
          chunksCount: chunks.length
        }
      );

      return chunks;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'chunk',
        'optimization_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          error: error instanceof Error ? error.message : 'unknown'
        }
      );
      throw error;
    }
  }
}

const generateResponseGenerator = async ({ 
  userInput, 
  context = [] 
}: GenerateResponseProps): Promise<string> => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const fullPrompt = buildPrompt(userInput, context);
    const chunks = ChunkProcessingService.optimizeChunks(fullPrompt);
    
    let response = '';
    for (const [index, chunk] of chunks.entries()) {
      const chunkStartTime = Date.now();
      try {
        const uploadResponse = await uploadChunk(chunk);
        const partialResponse = await generateResponse(uploadResponse.chunkId);
        response += partialResponse;

        monitoringManager.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          'chunk',
          'processing_duration',
          Date.now() - chunkStartTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          {
            chunkIndex: index,
            chunkSize: chunk.length,
            requestId: uploadResponse.requestId
          }
        );
      } catch (error) {
        if (error instanceof ChunkProcessingError && error.retryable) {
          monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'chunk',
            'processing_retry',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
              chunkIndex: index,
              error: error.message,
              requestId: error.requestId,
              metadata: error.metadata
            }
          );
          continue;
        }
        throw error;
      }
    }

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'response',
      'generation_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        chunksCount: chunks.length,
        responseLength: response.length,
        requestId
      }
    );

    return response.trim();
  } catch (error) {
    monitoringManager.logger.error(
      error instanceof Error ? error : new Error('Generation failed'),
      SystemError.PROCESSING_CHUNK_FAILED,
      {
        category: LogCategory.SYSTEM,
        pattern: LOG_PATTERNS.SYSTEM,
        metadata: {
          requestId,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'unknown'
        }
      }
    );

    throw error;
  }
};

export default generateResponseGenerator;