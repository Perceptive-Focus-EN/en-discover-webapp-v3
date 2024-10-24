// src/types/ChunkTypes.ts
export interface ChunkError extends Error {
  code: string;
  chunkId?: string;
  retryable: boolean;
}

// export class ChunkProcessingError extends AppError {
    // constructor(message: string, metadata?: Record<string, any>) {
        // super({
        // type: ErrorType.CHUNK_PROCESSING_ERROR,
            // code: ERROR_CODES.CHUNK.PROCESSING_FAILED, // Add this code
        // message,
        // metadata,
        // statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        // });
    // }
// }
// 