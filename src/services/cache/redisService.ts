// src/services/cache/redisService.ts
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { IntegrationError } from '@/MonitoringSystem/constants/errors';
import crypto from 'crypto';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

dotenv.config();

class RedisService {
  private client: Redis | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL = 3600;
  private isConnecting: boolean = false;

  constructor() {
    this.connect();
  }

  private connect() {

    // At the start of connect() always record a metric for connection attempt
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'redis',
      'connection_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        host: process.env.REDIS_HOST
      }
    );
    if (this.client || this.isConnecting) return;

    this.isConnecting = true;
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD,
        tls: {},
        retryStrategy: (times) => Math.min(times * 50, 2000),
        enableAutoPipelining: true,
        autoResendUnfulfilledCommands: true,
        keyPrefix: 'session:',
        enableOfflineQueue: true,
        enableReadyCheck: true,
      });

      this.client.on('error', (error) => {
        const appError = monitoringManager.error.createError(
          'integration',
          'REDIS_CONNECTION_FAILED',
          'Redis connection error',
          { error }
        );
        monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
          error,
          service: 'redis'
        });

        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 5000);
        }
      });

      this.client.on('connect', () => {
        monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'redis',
          'connection_status',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            status: 'connected',
            host: process.env.REDIS_HOST
          }
        );
        this.isConnecting = false;
      });
    } catch (error) {
      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_CONNECTION_FAILED',
        'Failed to initialize Redis client',
        { error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        error,
        service: 'redis'
      });
      this.isConnecting = false;
      throw appError;
    }

    // In connect():
this.client.on('ready', () => {
  monitoringManager.metrics.recordMetric(
    MetricCategory.SYSTEM,
    'redis',
    'connection_pool',
    this.client!.status === 'ready' ? 1 : 0,
    MetricType.GAUGE,
    MetricUnit.COUNT,
    {
      host: process.env.REDIS_HOST
    }
  );
});

    setInterval(() => {
  if (this.client) {
    this.client.info('memory').then(info => {
      const usedMemoryMatch = info.match(/used_memory:(\d+)/);
      const usedMemory = usedMemoryMatch ? parseInt(usedMemoryMatch[1], 10) : 0;
      monitoringManager.metrics.recordMetric(
        MetricCategory.RESOURCE,
        'redis',
        'memory_usage',
        usedMemory,
        MetricType.GAUGE,
        MetricUnit.BYTES,
        {
          host: process.env.REDIS_HOST
        }
      );
    });
  }
    }, 60000); // Every minute

  }

  private async ensureConnection(): Promise<void> {
    if (!this.client) {
      this.connect();
    }
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.ensureConnection();
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.ensureConnection();
      await this.client!.ping();
      monitoringManager.logger.info('Redis connection check successful', {
        type: IntegrationError.SERVICE_UNAVAILABLE,
        service: 'redis',
        operation: 'ping'
      });
      return true;
    } catch (error) {
      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_CONNECTION_FAILED',
        'Redis connection check failed',
        { error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        error,
        service: 'redis',
        operation: 'ping'
      });
      return false;
    }
  }

  async getValue(key: string): Promise<string | null> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      const value = await this.client!.get(key);
const duration = Date.now() - start;

      monitoringManager.metrics.recordMetric(
         MetricCategory.PERFORMANCE,
         'redis',
         'operation_duration',
         duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'get',
          key,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'redis',
        'cache_result',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          operation: 'get',
          result: value ? 'hit' : 'miss',
          key
        }
      );

      return value;
    } catch (error) {
      const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
          'redis',
          'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'get',
          key,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error getting value from Redis',
        { key, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        key,
        error,
        operation: 'get'
      });
      throw appError;
    }
  }

  async setValue(key: string, value: string, expiryTime?: number): Promise<void> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      if (expiryTime) {
        await this.client!.setex(key, expiryTime, value);
      } else {
        await this.client!.set(key, value, 'EX', this.DEFAULT_TTL);
      }
      const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'set',
          key,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'redis',
        'cache_result',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          operation: 'set',
          result: 'hit',
          key
        }
      );
    } catch (error) {
      const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'set',
          key,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error setting value in Redis',
        { key, value, expiryTime, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        key,
        error,
        operation: 'set'
      });
      throw appError;
    }
  }

  async deleteValue(key: string): Promise<void> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      const result = await this.client!.del(key);
const duration = Date.now() - start;

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'delete',
          key,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
         MetricCategory.BUSINESS,
         'redis',
         'cache_result',
         1,
         MetricType.COUNTER,
         MetricUnit.COUNT,
        {
          operation: 'delete',
          result: result === 0 ? 'miss' : 'hit',
          key
        }
      );
    } catch (error) {
      const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'delete',
          key,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error deleting value from Redis',
        { key, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        key,
        error,
        operation: 'delete'
      });
      throw appError;
    }
  }

  // Add after deleteValue method and before storeUserToken:

async batchOperation(operations: Array<{ key: string, value: string, expiryTime?: number }>) {
  const start = Date.now();
  try {
    await this.ensureConnection();
    const pipeline = this.client!.pipeline();
    
    operations.forEach(op => {
      if (op.expiryTime) {
        pipeline.setex(op.key, op.expiryTime, op.value);
      } else {
        pipeline.set(op.key, op.value, 'EX', this.DEFAULT_TTL);
      }
    });

    const results = await pipeline.exec();
    const duration = Date.now() - start;

    // Record batch performance
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'redis',
      'batch_duration',
      duration,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        operationCount: operations.length,
        success: true
      }
    );

    // Make sure this remains After pipeline execution
    monitoringManager.metrics.recordMetric(
      MetricCategory.RESOURCE,
      'redis',
      'batch_size',
      operations.reduce((acc, op) => acc + op.value.length, 0),
      MetricType.HISTOGRAM,
      MetricUnit.BYTES,
      {
        operationCount: operations.length
      }
    );

    // Record individual results
    const successCount = results?.filter(([err, _]) => !err).length || 0;
    const failureCount = results?.filter(([err, _]) => err).length || 0;

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'redis',
      'batch_result',
      successCount,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'batch',
        total: operations.length,
        failures: failureCount
      }
    );

    return results;

  } catch (error) {
    const duration = Date.now() - start;
  
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'redis',
      'batch_duration',
      duration,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        operationCount: operations.length,
        success: false
      }
    );

    const appError = monitoringManager.error.createError(
      'integration',
      'REDIS_BATCH_OPERATION_FAILED',
      'Error executing batch operation in Redis',
      { 
        error,
        operationCount: operations.length,
        keys: operations.map(op => op.key)
      }
    );
    monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
      error,
      operation: 'batch',
      operationCount: operations.length
    });
    throw appError;
  }
}

  async storeUserToken(userId: string, token: string): Promise<void> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      await this.client!.set(`user:token:${userId}`, token, 'EX', 60 * 60 * 24 * 7);
const duration = Date.now() - start;

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'storeToken',
          key: `user:token:${userId}`,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
       MetricCategory.BUSINESS,
       'redis',
       'cache_result',
       1,
       MetricType.COUNTER,
       MetricUnit.COUNT,
        {
          operation: 'storeToken',
          result: 'hit',
          key: `user:token:${userId}`
        }
      );
    } catch (error) {
const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
         MetricCategory.PERFORMANCE,
         'redis',
         'operation_duration',
         duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'storeToken',
          key: `user:token:${userId}`,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error storing user token in Redis',
        { userId, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        userId,
        error,
        operation: 'storeToken'
      });
      throw appError;
    }
  }

  async getUserToken(userId: string): Promise<string | null> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      const token = await this.client!.get(`user:token:${userId}`);
const duration = Date.now() - start;

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'getToken',
          key: `user:token:${userId}`,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'redis',
        'cache_result',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          operation: 'getToken',
          result: token ? 'hit' : 'miss',
          key: `user:token:${userId}`
        }
      );

      return token;
    } catch (error) {
const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
         MetricCategory.PERFORMANCE,
         'redis',
         'operation_duration',
         duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'getToken',
          key: `user:token:${userId}`,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error getting user token from Redis',
        { userId, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        userId,
        error,
        operation: 'getToken'
      });
      throw appError;
    }
  }

  async removeUserToken(userId: string): Promise<void> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      const result = await this.client!.del(`user:token:${userId}`);
const duration = Date.now() - start;

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'removeToken',
          key: `user:token:${userId}`,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'redis',
        'cache_result',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          operation: 'removeToken',
          result: result === 0 ? 'miss' : 'hit',
          key: `user:token:${userId}`
        }
      );
    } catch (error) {
const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
         MetricCategory.PERFORMANCE,
         'redis',
         'operation_duration',
         duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'removeToken',
          key: `user:token:${userId}`,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error removing user token from Redis',
        { userId, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        userId,
        error,
        operation: 'removeToken'
      });
      throw appError;
    }
  }

  async storeSession(jwtToken: string, sessionData: string, expiryTime?: number): Promise<void> {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const start = Date.now();
    try {
      await this.ensureConnection();
      await this.client!.set(`session:${sessionId}`, sessionData, 'EX', expiryTime || this.DEFAULT_TTL);
      await this.client!.set(`jwt:${sessionId}`, jwtToken, 'EX', expiryTime || this.DEFAULT_TTL);
const duration = Date.now() - start;

      monitoringManager.metrics.recordMetric(
         MetricCategory.PERFORMANCE,
         'redis',
         'operation_duration',
         duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'storeSession',
          key: `session:${sessionId}`,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'redis',
        'cache_result',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          operation: 'storeSession',
          result: 'hit',
          key: `session:${sessionId}`
        }
      );
    } catch (error) {
const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'storeSession',
          key: `session:${sessionId}`,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error storing session in Redis',
        { sessionId, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        sessionId,
        error,
        operation: 'storeSession'
      });
      throw appError;
    }
  }

  async getSession(jwtToken: string): Promise<string | null> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      const sessionId = await this.client!.get(`jwt:${jwtToken}`);
const duration = Date.now() - start;

      if (!sessionId) {
        monitoringManager.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          'redis',
          'operation_duration',
          duration,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          {
            operation: 'getSession',
            key: `jwt:${jwtToken}`,
            success: true
          }
        );

        monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'redis',
        'cache_result',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
          {
            operation: 'getSession',
            result: 'miss',
            key: `jwt:${jwtToken}`
          }
        );

        monitoringManager.logger.info('No session found for JWT', {
          type: IntegrationError.REDIS_MISS_RATE,
          operation: 'getSession'
        });
        return null;
      }

      const sessionData = await this.client!.get(`session:${sessionId}`);
      monitoringManager.metrics.recordMetric(
         MetricCategory.PERFORMANCE,
         'redis',
         'operation_duration',
         duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'getSession',
          key: `session:${sessionId}`,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
         MetricCategory.BUSINESS,
         'redis',
         'cache_result',
         1,
         MetricType.COUNTER,
         MetricUnit.COUNT,
        {
          operation: 'getSession',
          result: sessionData ? 'hit' : 'miss',
          key: `session:${sessionId}`
        }
      );

      return sessionData;
    } catch (error) {
const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
         MetricCategory.PERFORMANCE,
         'redis',
         'operation_duration',
         duration,
         MetricType.HISTOGRAM,
         MetricUnit.MILLISECONDS,
        {
          operation: 'getSession',
          key: `jwt:${jwtToken}`,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error getting session from Redis',
        { error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        error,
        operation: 'getSession'
      });
      throw appError;
    }
  }


  async storeRefreshToken(sessionId: string, refreshToken: string, expiryTime: number = 60 * 60 * 24 * 7): Promise<void> {
  const start = Date.now();
  try {
    await this.setValue(`refresh:${sessionId}`, refreshToken, expiryTime);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'redis',
      'refresh_token_store',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        sessionId,
        duration: Date.now() - start
      }
    );
  } catch (error) {
    throw monitoringManager.error.createError(
      'integration',
      'REDIS_TOKEN_STORE_FAILED',
      'Failed to store refresh token',
      { sessionId, error }
    );
  }
}

async getRefreshToken(sessionId: string): Promise<string | null> {
  const start = Date.now();
  try {
    const token = await this.getValue(`refresh:${sessionId}`);
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'redis',
      'refresh_token_retrieve',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        sessionId,
        found: !!token,
        duration: Date.now() - start
      }
    );
    
    return token;
  } catch (error) {
    throw monitoringManager.error.createError(
      'integration',
      'REDIS_TOKEN_RETRIEVE_FAILED',
      'Failed to retrieve refresh token',
      { sessionId, error }
    );
  }
}
  
  async storeAuthenticationData(
  sessionId: string,
  refreshToken: string,
  sessionData: string,
  expiryTime: number = 60 * 60 * 24
): Promise<void> {
  const operations = [
    { key: `refresh:${sessionId}`, value: refreshToken, expiryTime },
    { key: `session:${sessionId}`, value: sessionData, expiryTime }
  ];
  
  await this.batchOperation(operations);
}

  async deleteSession(sessionId: string): Promise<void> {
    const start = Date.now();
    try {
      await this.ensureConnection();
      const result = await this.client!.del(sessionId);
const duration = Date.now() - start;

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'redis',
        'operation_duration',
        duration,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          operation: 'deleteSession',
          key: sessionId,
          success: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'redis',
        'cache_result',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          operation: 'deleteSession',
          result: result === 0 ? 'miss' : 'hit',
          key: sessionId
        }
      );
    } catch (error) {
const duration = Date.now() - start;
      monitoringManager.metrics.recordMetric(
         MetricCategory.BUSINESS,
         'redis',
         'cache_result',
         1,
         MetricType.COUNTER,
         MetricUnit.COUNT,
        {
          operation: 'deleteSession',
          key: sessionId,
          success: false
        }
      );

      const appError = monitoringManager.error.createError(
        'integration',
        'REDIS_OPERATION_FAILED',
        'Error deleting session from Redis',
        { sessionId, error }
      );
      monitoringManager.logger.error(appError, IntegrationError.SERVICE_UNAVAILABLE, {
        sessionId,
        error,
        operation: 'deleteSession'
      });
      throw appError;
    }
  }

 // Add cleanup method at the end of the class always please so that it is easy to find and maintain
  public async cleanup(): Promise<void> {
    if (this.client) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'redis',
        'connection_close',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          host: process.env.REDIS_HOST
        }
      );
      await this.client.quit();
      this.client = null;
    }
  }
} // Class closing brace in case you missed it because of the cleanup method and the code being too long

export const redisService = new RedisService();