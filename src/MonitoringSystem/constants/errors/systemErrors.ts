export enum SystemError {
    // Database Errors
    DATABASE_CONNECTION = 'system/database/connection',
    DATABASE_QUERY = 'system/database/query',
    DATABASE_CONNECTION_FAILED = 'system/db/connection_failed',
    DATABASE_QUERY_FAILED = 'system/db/query_failed',
    DATABASE_INTEGRITY = 'system/db/integrity',
    DATABASE_INDEX = 'system/db/index',
    DATABASE_MIGRATION = 'system/db/migration',
    DATABASE_OPERATION_FAILED = 'system/db/operation_failed',
    DATABASE_INVALID_DATA = 'system/db/invalid_data',
    DATABASE_INTEGRITY_ERROR = 'system/db/integrity_error',
    DATABASE_LATENCY = 'system/db/latency',

    // Redis Errors
    REDIS_CONNECTION = 'system/redis/connection',
    REDIS_CONNECTION_FAILED = 'system/redis/connection_failed',
    REDIS_OPERATION_FAILED = 'system/redis/operation_failed',
    REDIS_INVALID_DATA = 'system/redis/invalid_data',

    // General Errors
    GENERAL = 'system/general_error',
    UNAVAILABLE = 'system/unavailable',

    // Processing Errors
    PROCESSING_CHUNK_FAILED = 'system/processing/chunk_failed',
    PROCESSING_CHUNK_VALIDATION_FAILED = 'system/processing/chunk_validation_failed',
    PROCESSING_CHUNK_SIZE_EXCEEDED = 'system/processing/chunk_size_exceeded',

    // Server Errors
    SERVER_UNHEALTHY = 'system/server/unhealthy',
    SERVER_UNAVAILABLE = 'system/server/unavailable',
    SERVER_TIMEOUT = 'system/server/timeout',
    SERVER_OVERLOAD = 'system/server/overload',
    SERVER_TOO_MANY_REQUESTS = 'system/server/too_many_requests',
    SERVER_INTERNAL_ERROR = 'system/server/internal_error',
    NOT_IMPLEMENTED= 'system/server/not_implemented',         // Feature not implemented yet
      BAD_GATEWAY='system/server/bad_gateway',                 // Server received an invalid response from upstream
      GATEWAY_TIMEOUT='system/server/gateway_timeout',         // Timeout while acting as a gateway/proxy
      SERVICE_UNAVAILABLE= 'system/server/service_unavailable', // Service 


      // Metrics System Errors
  METRICS_PROCESSING_FAILED = 'system/metrics/processing_failed',
  METRICS_PERSISTENCE_FAILED = 'system/metrics/persistence_failed',
  METRICS_AGGREGATION_FAILED = 'system/metrics/aggregation_failed',
  METRICS_VALIDATION_FAILED = 'system/metrics/validation_failed',
  METRICS_BATCH_FAILED = 'system/metrics/batch_failed',


  // Logging Errors
  LOG_PROCESSING_FAILED = 'system/logging/processing_failed',
  LOG_PERSISTENCE_FAILED = 'system/logging/persistence_failed',
  LOG_AGGREGATION_FAILED = 'system/logging/aggregation_failed',
  LOG_FLUSH_FAILED = 'system/logging/flush_failed',
  LOG_INVALID_FORMAT = 'system/logging/invalid_format',
  LOG_QUEUE_FULL = 'system/logging/queue_full',
  LOG_BATCH_FAILED = 'system/logging/batch_failed',


    // Performance Errors
    PERFORMANCE_HIGH_LATENCY = 'system/performance/high_latency',
    PERFORMANCE_HIGH_CPU = 'system/performance/high_cpu',
    PERFORMANCE_HIGH_MEMORY = 'system/performance/high_memory',
    MEMORY_USAGE = 'system/performance/memory_usage',
    CPU_USAGE = 'system/performance/cpu_usage',
    HIGH_LATENCY = 'system/performance/high_latency',
    HIGH_CPU = 'system/performance/high_cpu',
    HIGH_MEMORY = 'system/performance/high_memory',
    HIGH_NETWORK = 'system/performance/high_network',
    HIGH_LOAD = 'system/performance/high_load',
    HIGH_CONCURRENCY = 'system/performance/high_concurrency',
    HIGH_TRAFFIC = 'system/performance/high_traffic',
    HIGH_ERROR_RATE = 'system/performance/high_error_rate',
    PERFORMANCE = 'system/performance',
    PERFORMANCE_LATENCY = 'system/performance/latency',
    PERFORMANCE_CPU = 'system/performance/cpu',
    PERFORMANCE_MEMORY = 'system/performance/memory',
    PERFORMANCE_DISK = 'system/performance/disk',
    PERFORMANCE_DISK_USAGE = 'system/performance/disk_usage',
    PERFORMANCE_DISK_LATENCY = 'system/performance/disk_latency',
  PERFORMANCE_DISK_READ = 'system/performance/disk_read',
  

    // API Related Errors
  LOGS_API_ERROR = 'system/api/logs_error',
  METRICS_API_ERROR = 'system/api/metrics_error',
}