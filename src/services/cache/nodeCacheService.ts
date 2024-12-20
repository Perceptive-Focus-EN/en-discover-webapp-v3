// // src/services/cache/nodeCacheService.ts

// import NodeCache from 'node-cache';
// import { redisService } from './redisService';
// import { logger } from '../..Loggers/logger';

// class NodeCacheService {
//   private cache: NodeCache;
//   private readonly CACHE_TTL = 3000;

//   constructor() {
//     this.cache = new NodeCache({ stdTTL: this.CACHE_TTL, checkperiod: 120 });
//     this.initializeRedis();
//   }

//   private async initializeRedis() {
//     const isConnected = await redisService.checkConnection();
//     if (!isConnected) {
//       logger.error(new Error('Failed to connect to Redis. Some functionality may be limited.'));
//     }
//   }

//   async getSession(sessionId: string): Promise<any | null> {
//     try {
//       // Check NodeCache first
//       const session = this.cache.get<any>(sessionId);
//       if (session) {
//         logger.info(`Cache hit for session: ${sessionId}`);
//         logger.increment(LOG_METRICS.NODECACHE_HIT);
//         return session;
//       }

//       // If not in NodeCache, check Redis
//       const sessionData = await redisService.getValue(sessionId);
//       if (sessionData) {
//         logger.info(`Redis hit for session: ${sessionId}`);
//         logger.increment(LOG_METRICS.REDIS_HIT);
//         // Parse the session data if it's stored as a string
//         const parsedSessionData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
//         // Store in NodeCache for future quick access
//         this.cache.set(sessionId, parsedSessionData);
//         return parsedSessionData;
//       }

//       logger.info(`No session found for ID: ${sessionId}`);
//       logger.increment(LOG_METRICS.CACHE_MISS);
//       return null;
//     } catch (error) {
//       logger.error(`Error getting session for ID ${sessionId}:`, error);
//       logger.increment(LOG_METRICS.CACHE_ERROR);
//       return null;
//     }
//   }

//   async setSession(sessionId: string, sessionData: any): Promise<void> {
//     try {
//       const stringifiedData = JSON.stringify(sessionData);
//       this.cache.set(sessionId, sessionData);
//       await redisService.setValue(sessionId, stringifiedData);
//       logger.info(`Session stored for ID: ${sessionId}`);
//       logger.increment(LOG_METRICS.SESSION_STORED);
//     } catch (error) {
//       logger.error(`Error storing session for ID ${sessionId}:`, error);
//       logger.increment(LOG_METRICS.SESSION_STORE_ERROR);
//     }
//   }

//   async deleteSession(sessionId: string): Promise<void> {
//     try {
//       this.cache.del(sessionId);
//       await redisService.deleteValue(sessionId);
//       logger.info(`Session deleted for ID: ${sessionId}`);
//       logger.increment(LOG_METRICS.SESSION_DELETED);
//     } catch (error) {
//       logger.error(`Error deleting session for ID ${sessionId}:`, error);
//       logger.increment(LOG_METRICS.SESSION_DELETE_ERROR);
//     }
//   }

//   async getValue(key: string): Promise<string | null> {
//     try {
//       const value = this.cache.get<string>(key);
//       if (value) {
//         logger.info(`NodeCache hit for key: ${key}`);
//         logger.increment('nodecache_hit');
//         return value;
//       }

//       const redisValue = await redisService.getValue(key);
//       if (redisValue) {
//         this.cache.set(key, redisValue);
//         logger.info(`Redis hit for key: ${key}`);
//         logger.increment('redis_hit');
//         return redisValue;
//       }

//       logger.info(`Cache miss for key: ${key}`);
//       logger.increment('cache_miss');
//       return null;
//     } catch (error) {
//       logger.error(`Error getting value for key ${key}:`, error);
//       logger.increment('cache_error');
//       return null;
//     }
//   }

//   async setValue(key: string, value: string, expiryTime?: number): Promise<void> {
//     try {
//       if (expiryTime !== undefined) {
//         this.cache.set(key, value, expiryTime);
//       } else {
//         this.cache.set(key, value);
//       }
//       await redisService.setValue(key, value, expiryTime);
//       logger.info(`Value stored for key: ${key}`);
//       logger.increment(LOG_METRICS.VALUE_STORED);
//     } catch (error) {
//       logger.error(`Error setting value for key ${key}:`, error);
//       logger.increment(LOG_METRICS.VALUE_STORE_ERROR);
//     }
//   }

//   async getKeys(pattern: string): Promise<string[]> {
//     try {
//       const keys = this.cache.keys();
//       return keys.filter((key) => key.match(pattern));
//     } catch (error) {
//       logger.error('Error getting keys from NodeCache:', error);
//       logger.increment(LOG_METRICS.GET_KEYS_ERROR);
//       return [];
//     }
//   }

//   async deleteValue(key: string): Promise<void> {
//     try {
//       this.cache.del(key);
//       await redisService.deleteValue(key);
//       logger.info(`Value deleted for key: ${key}`);
//       logger.increment(LOG_METRICS.VALUE_DELETED);
//     } catch (error) {
//       logger.error(`Error deleting value for key ${key}:`, error);
//       logger.increment(LOG_METRICS.VALUE_DELETE_ERROR);
//     }
//   }
// }

// export const nodeCacheService = new NodeCacheService();