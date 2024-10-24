// src/constants/aiConstants.ts

// Constants


export const CHUNK_CONFIG = {
  MAX_CHUNK_SIZE: 3500,        // For AI models with ~4000 token limits
  MAX_CHUNKS: 10,              // Scalable batch size for memory management
  MAX_CONTEXT_LENGTH: 5,       // Number of chunks in a single context window
  MIN_CHUNK_SIZE: 800,         // 20-25% of MAX_CHUNK_SIZE
  OVERLAP_SIZE: 150,           // 3-5% of MAX_CHUNK_SIZE
  MAX_RETRIES: 4,              // Fault tolerance without excessive delays
  RETRY_DELAY: 1200,           // 1.2-second delay between retries
  TIMEOUT: 30000,              // 30 seconds for batch processing
  MAX_ERROR_THRESHOLD: 2,      // Allowable errors before aborting
  SPLIT_STRATEGY: 'sentence',  // Chunk splitting at sentence boundaries
  LOG_LEVEL: 'info'            // Verbosity of logs for debugging
} as const;
