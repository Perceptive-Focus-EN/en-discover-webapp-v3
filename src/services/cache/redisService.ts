// src/services/cache/redisService.ts

import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from '../../utils/ErrorHandling/logger';
import crypto from 'crypto';
import { LOG_METRICS } from '../../constants/logging';

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
        logger.error(new Error('Redis connection error'), { error });
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 5000); // Retry connection after 5 seconds
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnecting = false;
      });
    } catch (error) {
      logger.error(new Error('Failed to initialize Redis client'), { error });
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
      logger.error(new Error('Redis connection check failed'), { error });
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
      logger.error(new Error('Error deleting session from Redis'), { sessionId, error });
      throw error;
    }
  }

  async getValue(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const value = await this.client!.get(key);
      if (value) {
        logger.info('Redis hit for key', { key, metric: LOG_METRICS.REDIS_HIT });
      } else {
        logger.info('Redis miss for key', { key, metric: LOG_METRICS.REDIS_MISS });
      }
      return value;
    } catch (error) {
      logger.error(new Error('Error getting value from Redis'), { key, error });
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
      logger.info('Value set for key', { key, ttl: expiryTime || this.DEFAULT_TTL });
    } catch (error) {
      logger.error(new Error('Error setting value in Redis'), { key, value, expiryTime, error });
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
      logger.error(new Error('Error deleting value from Redis'), { key, error });
      throw error;
    }
  }

  async storeUserToken(userId: string, token: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client!.set(`user:token:${userId}`, token, 'EX', 60 * 60 * 24 * 7); // 7-day TTL
      logger.info('Token stored for user', { userId });
    } catch (error) {
      logger.error(new Error('Error storing user token in Redis'), { userId, error });
      throw error;
    }
  }

  async removeUserToken(userId: string): Promise<void> {
    try {
      await this.ensureConnection();
      const result = await this.client!.del(`user:token:${userId}`);
      if (result === 0) {
        logger.warn(`Token for user ${userId} not found during deletion.`);
      } else {
        logger.info('Token removed for user', { userId });
      }
    } catch (error) {
      logger.error(new Error('Error removing user token from Redis'), { userId, error });
      throw error;
    }
  }

  async getUserToken(userId: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const token = await this.client!.get(`user:token:${userId}`);
      if (token) {
        logger.info('Token retrieved for user', { userId });
      } else {
        logger.info('No token found for user', { userId });
      }
      return token;
    } catch (error) {
      logger.error(new Error('Error getting user token from Redis'), { userId, error });
      throw error;
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      const ttl = await this.client!.ttl(key);
      if (ttl >= 0) {
        logger.info('TTL for key', { key, ttl });
      } else if (ttl === -1) {
        logger.warn(`Key ${key} exists but has no associated expire.`);
      } else if (ttl === -2) {
        logger.warn(`Key ${key} does not exist in Redis.`);
      }
      return ttl;
    } catch (error) {
      logger.error(new Error('Error getting TTL from Redis'), { key, error });
      throw error;
    }
  }

  async storeRefreshToken(sessionId: string, refreshToken: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client!.set(`refresh_token:${sessionId}`, refreshToken, 'EX', 60 * 60 * 24 * 7); // 7-day TTL
      logger.info('Refresh token stored for session', { sessionId });
    } catch (error) {
      logger.error(new Error('Error storing refresh token in Redis'), { sessionId, error });
      throw error;
    }
  }

  async getRefreshToken(sessionId: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const token = await this.client!.get(`refresh_token:${sessionId}`);
      if (token) {
        logger.info('Refresh token retrieved for session', { sessionId });
      } else {
        logger.info('No refresh token found for session', { sessionId });
      }
      return token;
    } catch (error) {
      logger.error(new Error('Error getting refresh token from Redis'), { sessionId, error });
      throw error;
    }
  }

  async deleteRefreshToken(sessionId: string): Promise<void> {
    try {
      await this.ensureConnection();
      const result = await this.client!.del(`refresh_token:${sessionId}`);
      if (result === 0) {
        logger.warn(`Refresh token for session ${sessionId} not found during deletion.`);
      } else {
        logger.info('Refresh token removed for session', { sessionId });
      }
    } catch (error) {
      logger.error(new Error('Error removing refresh token from Redis'), { sessionId, error });
      throw error;
    }
  }

  async storeSession(jwtToken: string, sessionData: string, expiryTime?: number): Promise<void> {
    const sessionId = crypto.randomBytes(16).toString('hex'); // Generate session ID
    try {
      await this.ensureConnection();
      await this.client!.set(`session:${sessionId}`, sessionData, 'EX', expiryTime || this.DEFAULT_TTL);
      await this.client!.set(`jwt:${sessionId}`, jwtToken, 'EX', expiryTime || this.DEFAULT_TTL);
      logger.info('Session stored', { sessionId });
    } catch (error) {
      logger.error(new Error('Error storing session in Redis'), { sessionId, error });
      throw error;
    }
  }

  async getSession(jwtToken: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const sessionId = await this.client!.get(`jwt:${jwtToken}`);
      if (!sessionId) {
        logger.info('No session found for JWT token', { jwtToken });
        return null;
      }
      const sessionData = await this.client!.get(`session:${sessionId}`);
      if (sessionData) {
        logger.info('Session retrieved', { sessionId });
      } else {
        logger.info('No session data found', { sessionId });
      }
      return sessionData;
    } catch (error) {
      logger.error(new Error('Error getting session from Redis'), { error });
      throw error;
    }
  }
}

export const redisService = new RedisService();
