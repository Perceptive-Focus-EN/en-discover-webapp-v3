import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from '../../utils/ErrorHandling/logger';
import crypto from 'crypto';

dotenv.config();

class RedisService {
  private client: Redis | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL = 3600; // 1 hour default TTL
  private isConnecting: boolean = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.client || this.isConnecting) return;

    this.isConnecting = true;
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD,
        tls: {}, // Enable TLS for Azure Redis Cache
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        enableAutoPipelining: true,
        autoResendUnfulfilledCommands: true,
        keyPrefix: 'session:',
        enableOfflineQueue: true,
        enableReadyCheck: true,
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', { error });
        logger.increment('redis_connection_error');
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 5000); // Try to reconnect after 5 seconds
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnecting = false;
      });
    } catch (error) {
      logger.error('Failed to initialize Redis client:', { error });
      this.isConnecting = false;
      throw error;
    }
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
      logger.info('Redis connection successful');
      return true;
    } catch (error) {
      logger.error('Redis connection check failed:', { error });
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.ensureConnection();
      const result = await this.client!.del(sessionId);
      if (result === 0) {
        logger.warn(`Session ID ${sessionId} not found in Redis during deletion.`);
      } else {
        logger.info(`Session ID ${sessionId} deleted successfully.`);
      }
    } catch (error) {
      logger.error('Error deleting session from Redis:', { sessionId, error });
      logger.increment('redis_delete_session_error');
      throw error;
    }
  }

  async getValue(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const value = await this.client!.get(key);
      if (value) {
        logger.info(`Redis hit for key: ${key}`);
        logger.increment('redis_hit');
      } else {
        logger.info(`Redis miss for key: ${key}`);
        logger.increment('redis_miss');
      }
      return value;
    } catch (error) {
      logger.error('Error getting value from Redis:', { key, error });
      logger.increment('redis_get_error');
      throw error;
    }
  }

  async setValue(key: string, value: string, expiryTime?: number): Promise<void> {
    try {
      await this.ensureConnection();
      if (expiryTime) {
        await this.client!.setex(key, expiryTime, value);
      } else {
        await this.client!.set(key, value, 'EX', this.DEFAULT_TTL);
      }
      logger.info(`Value set for key: ${key} with TTL: ${expiryTime || this.DEFAULT_TTL}`);
    } catch (error) {
      logger.error('Error setting value in Redis:', { key, value, expiryTime, error });
      logger.increment('redis_set_error');
      throw error;
    }
  }

  async deleteValue(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      const result = await this.client!.del(key);
      if (result === 0) {
        logger.warn(`Key ${key} not found in Redis during deletion.`);
      } else {
        logger.info(`Deleted value for key: ${key}`);
      }
    } catch (error) {
      logger.error('Error deleting value from Redis:', { key, error });
      logger.increment('redis_delete_error');
      throw error;
    }
  }

  async storeUserToken(userId: string, token: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client!.set(`user:token:${userId}`, token, 'EX', 60 * 60 * 24 * 7); // expires in 7 days
      logger.info(`Token stored for userId: ${userId}`);
    } catch (error) {
      logger.error('Error storing user token in Redis:', { userId, error });
      logger.increment('redis_store_user_token_error');
      throw error;
    }
  }

  
  async removeUserToken(userId: string): Promise<void> {
    try {
      await this.ensureConnection();
      const result = await this.client!.del(`user:token:${userId}`);
      if (result === 0) {
        logger.warn(`Token for userId ${userId} not found during deletion.`);
      } else {
        logger.info(`Token removed for userId: ${userId}`);
      }
    } catch (error) {
      logger.error('Error removing user token from Redis:', { userId, error });
      logger.increment('redis_remove_user_token_error');
      throw error;
    }
  }


  async getUserToken(userId: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const token = await this.client!.get(`user:token:${userId}`);
      if (token) {
        logger.info(`Token retrieved for userId: ${userId}`);
      } else {
        logger.info(`No token found for userId: ${userId}`);
      }
      return token;
    } catch (error) {
      logger.error('Error getting user token from Redis:', { userId, error });
      logger.increment('redis_get_user_token_error');
      throw error;
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      const ttl = await this.client!.ttl(key);
      if (ttl >= 0) {
        logger.info(`TTL for key ${key} is ${ttl} seconds.`);
      } else if (ttl === -1) {
        logger.warn(`Key ${key} exists but has no associated expire.`);
      } else if (ttl === -2) {
        logger.warn(`Key ${key} does not exist in Redis.`);
      }
      return ttl;
    } catch (error) {
      logger.error('Error getting TTL from Redis:', { key, error });
      logger.increment('redis_ttl_error');
      throw error;
    }
  }

  async storeRefreshToken(sessionId: string, refreshToken: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client!.set(`refresh_token:${sessionId}`, refreshToken, 'EX', 60 * 60 * 24 * 7); // expires in 7 days
      logger.info(`Refresh token stored for sessionId: ${sessionId}`);
    } catch (error) {
      logger.error('Error storing refresh token in Redis:', { sessionId, error });
      logger.increment('redis_store_refresh_token_error');
      throw error;
    }
  }

  async getRefreshToken(sessionId: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const token = await this.client!.get(`refresh_token:${sessionId}`);
      if (token) {
        logger.info(`Refresh token retrieved for sessionId: ${sessionId}`);
      } else {
        logger.info(`No refresh token found for sessionId: ${sessionId}`);
      }
      return token;
    } catch (error) {
      logger.error('Error getting refresh token from Redis:', { sessionId, error });
      logger.increment('redis_get_refresh_token_error');
      throw error;
    }
  }

  async deleteRefreshToken(sessionId: string): Promise<void> {
    try {
      await this.ensureConnection();
      const result = await this.client!.del(`refresh_token:${sessionId}`);
      if (result === 0) {
        logger.warn(`Refresh token for sessionId ${sessionId} not found during deletion.`);
      } else {
        logger.info(`Refresh token removed for sessionId: ${sessionId}`);
      }
    } catch (error) {
      logger.error('Error removing refresh token from Redis:', { sessionId, error });
      logger.increment('redis_remove_refresh_token_error');
      throw error;
    }
  }


  async storeSession(jwtToken: string, sessionData: string, expiryTime?: number): Promise<void> {
    const sessionId = crypto.randomBytes(16).toString('hex'); // Generate a shorter session ID
    try {
      await this.ensureConnection();
      await this.client!.set(`session:${sessionId}`, sessionData, 'EX', expiryTime || this.DEFAULT_TTL);
      await this.client!.set(`jwt:${sessionId}`, jwtToken, 'EX', expiryTime || this.DEFAULT_TTL);
      logger.info(`Session stored for sessionId: ${sessionId}`);
    } catch (error) {
      logger.error('Error storing session in Redis:', { sessionId, error });
      logger.increment('redis_store_session_error');
      throw error;
    }
  }


  async getSession(jwtToken: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const sessionId = await this.client!.get(`jwt:${jwtToken}`);
      if (!sessionId) {
        logger.info(`No session found for JWT token`);
        return null;
      }
      const sessionData = await this.client!.get(`session:${sessionId}`);
      if (sessionData) {
        logger.info(`Session retrieved for sessionId: ${sessionId}`);
      } else {
        logger.info(`No session data found for sessionId: ${sessionId}`);
      }
      return sessionData;
    } catch (error) {
      logger.error('Error getting session from Redis:', { error });
      logger.increment('redis_get_session_error');
      throw error;
    }
  }
}

export const redisService = new RedisService();
