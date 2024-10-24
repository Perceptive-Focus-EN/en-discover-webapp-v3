// src/MonitoringSystem/constants/messages/systemMessages.ts
import { SystemError } from "../errors/systemErrors";

export const SystemMessages = {

// <-------  Database Messages -------->

  [SystemError.DATABASE_CONNECTION]: {
    error: 'Database connection failed',
    warn: 'Database connection unstable',
    info: 'Database connected successfully'
  },
  [SystemError.DATABASE_QUERY]: {
    error: 'Database query execution failed',
    warn: 'Query performance degraded',
    info: 'Query executed successfully'
  },
  [SystemError.DATABASE_CONNECTION_FAILED]: {
    error: 'Failed to establish database connection',
    warn: 'Database connection attempt unsuccessful',
    info: 'Database connection attempt initiated'
  },
  [SystemError.DATABASE_QUERY_FAILED]: {
    error: 'Database query operation failed',
    warn: 'Query execution encountered issues',
    info: 'Query execution monitored'
  },
  [SystemError.DATABASE_INTEGRITY_ERROR]: {
    error: 'Database integrity constraint violation',
    warn: 'Potential data integrity issue detected',
    info: 'Data integrity check performed'
    },

  // <-------  Redis Messages -------->

  [SystemError.REDIS_CONNECTION]: {
    error: 'Redis connection error',
    warn: 'Redis connection experiencing issues',
    info: 'Redis connection status checked'
  },
  [SystemError.REDIS_CONNECTION_FAILED]: {
    error: 'Failed to connect to Redis',
    warn: 'Redis connection attempt unsuccessful',
    info: 'Redis connection attempt initiated'
  },
  [SystemError.REDIS_OPERATION_FAILED]: {
    error: 'Redis operation failed',
    warn: 'Redis operation performance degraded',
    info: 'Redis operation monitored'
  },
  [SystemError.REDIS_INVALID_DATA]: {
    error: 'Invalid data format in Redis',
    warn: 'Data validation issues in Redis',
    info: 'Redis data validation performed'
    },

  // <-------  General System Messages -------->

  [SystemError.GENERAL]: {
    error: 'System encountered an error',
    warn: 'System experiencing issues',
    info: 'System status checked'
  },
  [SystemError.UNAVAILABLE]: {
    error: 'System currently unavailable',
    warn: 'System availability degraded',
    info: 'System availability checked'
    },
  
  // <-------  Processing Messages -------->


  [SystemError.PROCESSING_CHUNK_FAILED]: {
    error: 'Failed to process data chunk',
    warn: 'Chunk processing encountered issues',
    info: 'Chunk processing attempted'
  },
  [SystemError.PROCESSING_CHUNK_VALIDATION_FAILED]: {
    error: 'Chunk validation failed',
    warn: 'Chunk validation issues detected',
    info: 'Chunk validation performed'
  },
  [SystemError.PROCESSING_CHUNK_SIZE_EXCEEDED]: {
    error: 'Chunk size limit exceeded',
    warn: 'Chunk size approaching limit',
    info: 'Chunk size verified'
    },

  // <-------  Server Messages -------->

  [SystemError.SERVER_UNHEALTHY]: {
    error: 'Server health check failed',
    warn: 'Server health degrading',
    info: 'Server health monitored'
  },
  [SystemError.SERVER_UNAVAILABLE]: {
    error: 'Server is unavailable',
    warn: 'Server availability issues detected',
    info: 'Server availability checked'
  },
  [SystemError.SERVER_TIMEOUT]: {
    error: 'Server request timed out',
    warn: 'Server response time degraded',
    info: 'Server response time monitored'
  },
  [SystemError.SERVER_OVERLOAD]: {
    error: 'Server is overloaded',
    warn: 'High server load detected',
    info: 'Server load monitored'
  },
  [SystemError.SERVER_TOO_MANY_REQUESTS]: {
    error: 'Rate limit exceeded',
    warn: 'Approaching rate limit threshold',
    info: 'Rate limit checked'
  },
  [SystemError.SERVER_INTERNAL_ERROR]: {
    error: 'Internal server error occurred',
    warn: 'Server experiencing internal issues',
    info: 'Server internal status checked'
  },

  // <-------  Performance Messages -------->

  [SystemError.PERFORMANCE_HIGH_LATENCY]: {
    error: 'Critical latency detected',
    warn: 'High latency observed',
    info: 'Latency monitored'
  },
  [SystemError.PERFORMANCE_HIGH_CPU]: {
    error: 'Critical CPU usage detected',
    warn: 'High CPU usage observed',
    info: 'CPU usage monitored'
  },
  [SystemError.PERFORMANCE_HIGH_MEMORY]: {
    error: 'Critical memory usage detected',
    warn: 'High memory usage observed',
    info: 'Memory usage monitored'
    },

  // <-------  Metrics Messages -------->

  [SystemError.METRICS_API_ERROR]: {
  error: 'Error processing metrics API request',
  warn: 'Issues detected in metrics API processing',
  info: 'Metrics API request processed'
},
  [SystemError.METRICS_PROCESSING_FAILED]: {
    error: 'Failed to process metrics',
    warn: 'Metrics processing issues detected',
    info: 'Metrics processing attempted'
  },
  [SystemError.METRICS_PERSISTENCE_FAILED]: {
    error: 'Failed to persist metrics',
    warn: 'Metrics persistence issues detected',
    info: 'Metrics persistence attempted'
  },
  [SystemError.METRICS_AGGREGATION_FAILED]: {
    error: 'Failed to aggregate metrics',
    warn: 'Metrics aggregation issues detected',
    info: 'Metrics aggregation attempted'
  },
  [SystemError.METRICS_VALIDATION_FAILED]: {
    error: 'Invalid metric data',
    warn: 'Metric validation issues detected',
    info: 'Metric validation attempted'
  },
  [SystemError.METRICS_BATCH_FAILED]: {
    error: 'Failed to process metric batch',
    warn: 'Metric batch issues detected',
    info: 'Metric batch processing attempted'
    },

// <-------  Logging Messages -------->

  [SystemError.LOGS_API_ERROR]: {
  error: 'Error processing logs API request',
  warn: 'Issues detected in logs API processing',
  info: 'Logs API request processed'
  },
  [SystemError.LOG_QUEUE_FULL]: {
    error: 'Log queue is full',
    warn: 'Log queue approaching capacity',
    info: 'Log queue status checked'
  },
   [SystemError.LOG_PROCESSING_FAILED]: {
    error: 'Failed to process log entry',
    warn: 'Log processing issues detected',
    info: 'Log processing attempted'
  },
  [SystemError.LOG_PERSISTENCE_FAILED]: {
    error: 'Failed to persist logs',
    warn: 'Log persistence issues detected',
    info: 'Log persistence attempted'
  },
  [SystemError.LOG_AGGREGATION_FAILED]: {
    error: 'Failed to aggregate logs',
    warn: 'Log aggregation issues detected',
    info: 'Log aggregation attempted'
  },
  [SystemError.LOG_FLUSH_FAILED]: {
    error: 'Failed to flush log queue',
    warn: 'Log flush issues detected',
    info: 'Log flush attempted'
  },
  [SystemError.LOG_INVALID_FORMAT]: {
    error: 'Invalid log format',
    warn: 'Log format validation failed',
    info: 'Log format validation performed'
  }

} as const;