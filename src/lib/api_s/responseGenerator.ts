import { generateResponse } from './openAIApiService';
import axiosInstance from '../axiosSetup';
import { AxiosResponse, AxiosError } from 'axios';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

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

const CHUNK_CONFIG = {
  MAX_SIZE: 4000,
  MAX_CONTEXT_LENGTH: 5,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000
} as const;

class ChunkProcessingError extends Error {
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly requestId?: string;

  constructor(message: string, retryable: boolean, statusCode?: number, requestId?: string) {
    super(message);
    this.retryable = retryable;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.name = 'ChunkProcessingError';
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
    const response: AxiosResponse<ChunkUploadResponse> = await axiosInstance.post(
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
        requestId: response.data.requestId,
        success: true
      }
    );

    return response.data;
  } catch (error) {
    const isAxiosError = error instanceof AxiosError;
    const statusCode = isAxiosError ? error.response?.status : undefined;
    const isRetryable = statusCode ? statusCode >= 500 : false;

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'chunk',
      'upload_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: isAxiosError ? 'network' : 'unknown',
        statusCode,
        retryCount,
        retryable: isRetryable
      }
    );

    if (isRetryable && retryCount < CHUNK_CONFIG.MAX_RETRIES) {
      await sleep(CHUNK_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
      return uploadChunk(chunk, retryCount + 1);
    }

    throw new ChunkProcessingError(
      `Failed to upload chunk: ${error.message}`,
      isRetryable,
      statusCode
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
          currentIndex + CHUNK_CONFIG.MAX_SIZE,
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
        const { chunkId } = await uploadChunk(chunk);
        const partialResponse = await generateResponse(chunkId);
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
            requestId
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
              requestId
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
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'response',
      'generation_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        requestId,
        duration: Date.now() - startTime
      }
    );
    throw error;
  }
};

export default generateResponseGenerator;