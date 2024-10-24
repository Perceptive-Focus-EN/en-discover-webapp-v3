import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { Collection, WithId } from 'mongodb';
import { ExtendedUserInfo } from '../../../types/User/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { chunkProcessingService } from '../../../components/AI/services/ChunkProcessingService';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { CHUNK_CONFIG } from '../../../components/AI/constants/aiConstants';

// API Configuration
// src/pages/api/chunks/text.ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    externalResolver: true,
    responseLimit: false
  },
};

// Constants
// Update CHUNK_VALIDATION to use CHUNK_CONFIG
const CHUNK_VALIDATION = {
  MAX_SIZE: CHUNK_CONFIG.MAX_CHUNK_SIZE,
  MIN_SIZE: CHUNK_CONFIG.MIN_CHUNK_SIZE,
  MAX_CHUNKS: CHUNK_CONFIG.MAX_CHUNKS || 100,
  TIMEOUT: CHUNK_CONFIG.TIMEOUT
};

// Rate Limiter Configuration
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
  keyPrefix: 'text-chunk',
});

// Interfaces
interface FormFields extends Fields {
  chunk?: string[];
}

interface ProcessedChunk {
  chunkId: string;
  content: string;
  timestamp: Date;
}

// Type Guards
function isValidFormFields(fields: Fields): fields is FormFields {
  return 'chunk' in fields && (
    typeof fields.chunk === 'string' || 
    Array.isArray(fields.chunk)
  );
}

// Utility Functions
async function processAndStoreChunk(
  chunk: string,
  chunkId: string,
  userId: string,
  usersCollection: Collection<WithId<ExtendedUserInfo>>
): Promise<void> {
  const processStart = Date.now();

  try {
    const timestamp = new Date();
    const processedChunk: ProcessedChunk = {
      chunkId,
      content: chunk,
      timestamp
    };

    await usersCollection.updateOne(
      { userId },
      {
        $push: {
          textChunks: processedChunk
        },
      }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'chunk',
      'processing_duration',
      Date.now() - processStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        userId,
        chunkId,
        chunkSize: chunk.length,
      }
    );
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'chunk',
      'processing_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId,
        chunkId,
        error: error instanceof Error ? error.message : 'unknown'
      }
    );

    throw monitoringManager.error.createError(
      'system',
      'CHUNK_PROCESSING_FAILED',
      'Failed to process and store chunk',
      { error, userId, chunkId }
    );
  }
}

function validateChunkData(chunk: string | string[] | undefined): string {
  if (!chunk) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'chunk',
      'validation_failed',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { reason: 'missing_chunk' }
    );
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'No text chunk provided'
    );
  }

  const chunkData = Array.isArray(chunk) ? chunk[0] : chunk;

  if (!chunkData || typeof chunkData !== 'string') {
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'chunk',
      'validation_failed',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { reason: 'invalid_type' }
    );
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Invalid chunk data type'
    );
  }

  if (chunkData.length > CHUNK_VALIDATION.MAX_SIZE) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'chunk',
      'validation_failed',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { 
        reason: 'size_exceeded',
        size: chunkData.length,
        maxSize: CHUNK_VALIDATION.MAX_SIZE
      }
    );
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Chunk size exceeds maximum limit',
      { 
        size: chunkData.length,
        maxSize: CHUNK_VALIDATION.MAX_SIZE
      }
    );
  }

  if (chunkData.length < CHUNK_VALIDATION.MIN_SIZE) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'chunk',
      'validation_failed',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { 
        reason: 'size_too_small',
        size: chunkData.length,
        minSize: CHUNK_VALIDATION.MIN_SIZE
      }
    );
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Chunk size below minimum requirement',
      { 
        size: chunkData.length,
        minSize: CHUNK_VALIDATION.MIN_SIZE
      }
    );
  }

  return chunkData;
}

// Main Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  const requestId = uuidv4();

  try {
    // Method validation
    if (req.method !== 'POST') {
      const appError = monitoringManager.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        { method: req.method }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference,
      });
    }

    // Rate limiting
    const userId = req.headers['user-id'] as string;
    try {
      await rateLimiter.consume(userId || req.socket.remoteAddress || 'unknown');
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'rate_limit',
        'exceeded',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { userId }
      );
      throw monitoringManager.error.createError(
        'security',
        'RATE_LIMIT_EXCEEDED',
        'Too many requests'
      );
    }

    // Auth validation
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'No token provided'
      );
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
    }

    // Database connection
    const client = await getCosmosClient();
    if (!client) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Failed to connect to database'
      );
    }

    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<ExtendedUserInfo>>;

    // User validation
    const user = await usersCollection.findOne({ userId: decodedToken.userId });
    if (!user) {
      throw monitoringManager.error.createError(
        'business',
        'USER_NOT_FOUND',
        'User not found',
        { userId: decodedToken.userId }
      );
    }

    // Form parsing with timeout
    const formData = await Promise.race([
      new Promise<FormFields>((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err, fields: Fields, files: Files) => {
          if (err) {
            monitoringManager.metrics.recordMetric(
              MetricCategory.SYSTEM,
              'form',
              'parsing_error',
              1,
              MetricType.COUNTER,
              MetricUnit.COUNT,
              { error: err.message }
            );
            reject(
              monitoringManager.error.createError(
                'business',
                'FORM_PARSING_FAILED',
                'Error parsing form data',
                { error: err }
              )
            );
            return;
          }

          if (!isValidFormFields(fields)) {
            monitoringManager.metrics.recordMetric(
              MetricCategory.BUSINESS,
              'form',
              'validation_failed',
              1,
              MetricType.COUNTER,
              MetricUnit.COUNT,
              { fields: Object.keys(fields) }
            );
            reject(
              monitoringManager.error.createError(
                'business',
                'VALIDATION_FAILED',
                'Invalid form data structure'
              )
            );
            return;
          }

          monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'form',
            'parsing_success',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
              hasChunk: !!fields.chunk,
              fieldCount: Object.keys(fields).length
            }
          );

          resolve(fields);
        });
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Form parsing timeout')), CHUNK_VALIDATION.TIMEOUT)
      )
    ]);

    // Chunk validation and processing
    const chunk = validateChunkData(formData.chunk);
    
    if (!chunkProcessingService.validateChunk(chunk)) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'chunk',
        'processing_validation_failed',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { 
          chunkSize: chunk.length,
          validationError: true
        }
      );
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Invalid chunk size or content',
        { chunkSize: chunk.length }
      );
    }

    // Process chunk
    const chunkId = uuidv4();
    await processAndStoreChunk(chunk, chunkId, decodedToken.userId, usersCollection);

    // Record success metrics
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'chunk',
      'processed',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        chunkId,
        chunkSize: chunk.length,
        duration: Date.now() - startTime,
        requestId
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Chunk processed successfully',
      data: {
        chunkId,
        processingTime: Date.now() - startTime,
        requestId
      },
    });

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'integration',
      'API_REQUEST_FAILED',
      'Request processing failed',
      { error, requestId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'chunk',
      'request_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        duration: Date.now() - startTime,
        requestId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference,
      requestId
    });
  }
}