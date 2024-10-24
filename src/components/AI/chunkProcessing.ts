// src/services/ai/chunkProcessing.ts
import { generateResponse } from '../../lib/api_s/openAIApiService';
import axiosInstance from '../../lib/axiosSetup';
import { AxiosResponse, AxiosError } from 'axios';
import { CHUNK_CONFIG } from './constants/aiConstants';
import { promptBuilderService } from './services/PromptBuilderService';
import { chunkProcessingService } from './services/ChunkProcessingService';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { SystemContext } from '@/MonitoringSystem/types/logging';
import { IntegrationError, SystemError } from '@/MonitoringSystem/constants/errors';
import { LOG_PATTERNS, LogCategory } from '@/MonitoringSystem/constants/logging';
interface ChunkProcessingSystemContext extends SystemContext {
  component: string;
}

const SYSTEM_CONTEXT: ChunkProcessingSystemContext = {
  component: 'ChunkProcessing',
  systemId: process.env.SYSTEM_ID || 'chunk-processing',
  systemName: 'ChunkProcessing',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
  version: process.env.SYSTEM_VERSION || '1.0',
  metadata: {
    service: 'chunk-processing'
  }
};
// Types
export interface GenerateResponseProps {
  userInput: string;
  context?: string[];
}

export interface ChunkUploadResponse {
  success: boolean;
  message: string;
  data: {
    chunkId: string;
    processingTime: number;
    requestId: string;
  };
}

// Error handling
// Update ChunkProcessingError
class ChunkProcessingError extends Error {
  public readonly retryable: boolean;
  public readonly requestId?: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string, 
    retryable: boolean = false, 
    requestId?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ChunkProcessingError';
    this.retryable = retryable;
    this.requestId = requestId;
    this.metadata = {
      ...metadata,
      component: SYSTEM_CONTEXT.component
    };
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
        requestId: response.data.data.requestId,
        success: true,
        component: SYSTEM_CONTEXT.component
      }
    );

    return response.data;
  } catch (error) {
    const isAxiosError = error instanceof AxiosError;
    const statusCode = isAxiosError ? error.response?.status : undefined;
    const isRetryable = statusCode ? statusCode >= 500 : false;
    const requestId = isAxiosError ? error.response?.data?.requestId : undefined;

    monitoringManager.logger.error(
      error instanceof Error ? error : new Error('Upload failed'),
      IntegrationError.API_REQUEST_FAILED,
      {
        category: LogCategory.SYSTEM,
        pattern: LOG_PATTERNS.SYSTEM,
        metadata: {
          statusCode,
          retryCount,
          requestId,
          component: SYSTEM_CONTEXT.component
        }
      }
    );

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
        retryable: isRetryable,
        requestId,
        component: SYSTEM_CONTEXT.component
      }
    );

    if (isRetryable && retryCount < CHUNK_CONFIG.MAX_RETRIES) {
      await sleep(CHUNK_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
      return uploadChunk(chunk, retryCount + 1);
    }

    throw new ChunkProcessingError(
      `Failed to upload chunk: ${error.message}`,
      isRetryable,
      requestId,
      { statusCode, retryCount }
    );
  }
};

const generateResponseGenerator = async ({ 
  userInput, 
  context = [] 
}: GenerateResponseProps): Promise<string> => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const fullPrompt = promptBuilderService.buildPrompt(userInput, context);
    const chunks = chunkProcessingService.optimizeChunks(fullPrompt);
    
    let response = '';
    for (const [index, chunk] of chunks.entries()) {
      const chunkStartTime = Date.now();
      try {
        const uploadResponse = await uploadChunk(chunk);
        const partialResponse = await generateResponse(uploadResponse.data.chunkId);
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
            requestId: uploadResponse.data.requestId
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
              requestId: error.requestId
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
        component: SYSTEM_CONTEXT.component
      }
    }
  );

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
      duration: Date.now() - startTime,
      component: SYSTEM_CONTEXT.component
    }
  );

  throw monitoringManager.error.createError(
    'system',
    SystemError.PROCESSING_CHUNK_FAILED,
    'Failed to generate response',
    { 
      error, 
      requestId,
      metadata: {
        component: SYSTEM_CONTEXT.component,
        duration: Date.now() - startTime
      }
    }
  );
  }
}

export default generateResponseGenerator;