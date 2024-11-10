// // src/UploadingSystem/services/RateLimiter.ts
// import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
// import { MetricCategory, MetricType } from '@/MonitoringSystem/constants/metrics';
// import { SystemError } from '@/MonitoringSystem/constants/errors';
// import { EventEmitter } from 'events';

// interface RateLimitConfig {
//     windowMs: number;          // Time window in milliseconds
//     maxRequestsPerWindow: number; // Max requests per window
//     maxConcurrentUploads: number; // Max concurrent uploads per user
//     burstLimit: number;        // Allow burst up to this limit
//     userTierLimits: {         // Different limits for different user tiers
//         free: number;
//         premium: number;
//         enterprise: number;
//     };
// }

// interface UserState {
//     requests: number;
//     lastReset: number;
//     activeUploads: number;
//     burstCredits: number;
//     tier: 'free' | 'premium' | 'enterprise';
//     uploadSizes: number[];    // Track recent upload sizes
//     tenantUploads?: Map<string, number>; // Track uploads per tenant
// }

// export class UploadRateLimiter extends EventEmitter {
//     private static instance: UploadRateLimiter | null = null;
//     private userStates = new Map<string, UserState>();
//     private readonly config: RateLimitConfig;

//     private constructor(config?: Partial<RateLimitConfig>) {
//         super();
//         this.config = {
//             windowMs: 60000,
//             maxRequestsPerWindow: 100,
//             maxConcurrentUploads: 3,
//             burstLimit: 5,
//             userTierLimits: {
//                 free: 3,
//                 premium: 10,
//                 enterprise: 50
//             },
//             ...config
//         };
//     }

//     static getInstance(config?: Partial<RateLimitConfig>): UploadRateLimiter {
//         if (!this.instance) {
//             this.instance = new UploadRateLimiter(config);
//         }
//         return this.instance;
//     }

//     async tryAcquire(userId: string, fileSize: number, userTier: string = 'free'): Promise<boolean> {
//         return this.tryAcquireWithTenant(userId, '', fileSize, userTier);
//     }

//     async tryAcquireWithTenant(userId: string, tenantId: string, fileSize: number, userTier: string = 'free'): Promise<boolean> {
//         try {
//             const state = this.getOrCreateUserState(userId, userTier as 'free' | 'premium' | 'enterprise');
            
//             // Add tenant-specific tracking
//             if (!state.tenantUploads) {
//                 state.tenantUploads = new Map();
//             }
//             const tenantUploads = state.tenantUploads.get(tenantId) || 0;

//             // Check tenant-specific limits
//             const tenantLimit = this.getTenantLimit(userTier);
//             if (tenantUploads >= tenantLimit) {
//                 this.emitRateLimitEvent(userId, 'limit_exceeded', {
//                     reason: 'tenant_limit',
//                     tenantId,
//                     currentUploads: tenantUploads,
//                     limit: tenantLimit
//                 });
//                 return false;
//             }

//             // Existing checks
//             this.resetWindowIfNeeded(state);
//             if (state.activeUploads >= this.getMaxConcurrentUploads(state.tier)) {
//                 this.emitRateLimitEvent(userId, 'limit_exceeded', {
//                     reason: 'concurrent_limit',
//                     currentUploads: state.activeUploads,
//                     limit: this.getMaxConcurrentUploads(state.tier)
//                 });
//                 return false;
//             }

//             if (!this.checkRateLimit(state, fileSize)) {
//                 this.emitRateLimitEvent(userId, 'limit_exceeded', {
//                     reason: 'rate_limit',
//                     fileSize,
//                     currentRequests: state.requests
//                 });
//                 return false;
//             }

//             // Update state
//             state.requests++;
//             state.activeUploads++;
//             state.uploadSizes.push(fileSize);
//             state.tenantUploads.set(tenantId, tenantUploads + 1);
            
//             this.emitRateLimitEvent(userId, 'connection_accepted', {
//                 tenantId,
//                 fileSize,
//                 userTier
//             });

//             return true;
//         } catch (error) {
//             monitoringManager.logger.error(error, SystemError.RATE_LIMIT_EXCEEDED, {
//                 userId,
//                 tenantId,
//                 fileSize,
//                 userTier
//             });
//             return false;
//         }
//     }

//     private getOrCreateUserState(userId: string, tier: 'free' | 'premium' | 'enterprise'): UserState {
//         if (!this.userStates.has(userId)) {
//             this.userStates.set(userId, {
//                 requests: 0,
//                 lastReset: Date.now(),
//                 activeUploads: 0,
//                 burstCredits: this.config.burstLimit,
//                 tier,
//                 uploadSizes: [],
//                 tenantUploads: new Map()
//             });
//         }
//         return this.userStates.get(userId)!;
//     }

//     private resetWindowIfNeeded(state: UserState): void {
//         const now = Date.now();
//         if (now - state.lastReset >= this.config.windowMs) {
//             // Partial reset for smooth transition
//             const windowsElapsed = Math.floor((now - state.lastReset) / this.config.windowMs);
//             const reduction = state.requests * (windowsElapsed / (windowsElapsed + 1));
            
//             state.requests = Math.max(0, Math.floor(state.requests - reduction));
//             state.lastReset = now;
            
//             // Replenish burst credits gradually
//             state.burstCredits = Math.min(
//                 this.config.burstLimit,
//                 state.burstCredits + windowsElapsed
//             );
//         }
//     }

//     private checkRateLimit(state: UserState, fileSize: number): boolean {
//         const baseLimit = this.config.userTierLimits[state.tier];
        
//         // Calculate dynamic limit based on recent activity
//         const averageUploadSize = this.calculateAverageUploadSize(state);
//         const dynamicLimit = this.calculateDynamicLimit(baseLimit, averageUploadSize, fileSize);

//         // Allow burst if within limits
//         if (state.requests >= dynamicLimit && state.burstCredits > 0) {
//             state.burstCredits--;
//             return true;
//         }

//         return state.requests < dynamicLimit;
//     }

//     private calculateAverageUploadSize(state: UserState): number {
//         if (state.uploadSizes.length === 0) return 0;
//         return state.uploadSizes.reduce((a, b) => a + b, 0) / state.uploadSizes.length;
//     }

//     private calculateDynamicLimit(baseLimit: number, avgSize: number, currentSize: number): number {
//         // Adjust limit based on file size ratio
//         const sizeRatio = currentSize / (avgSize || currentSize);
//         return Math.max(1, Math.floor(baseLimit / Math.sqrt(sizeRatio)));
//     }

//     private getMaxConcurrentUploads(tier: 'free' | 'premium' | 'enterprise'): number {
//         const baseConcurrent = this.config.maxConcurrentUploads;
//         switch (tier) {
//             case 'enterprise':
//                 return baseConcurrent * 3;
//             case 'premium':
//                 return baseConcurrent * 2;
//             default:
//                 return baseConcurrent;
//         }
//     }

//     public releaseUpload(userId: string): void {
//         this.releaseUploadWithTenant(userId, '');
//     }

//     public releaseUploadWithTenant(userId: string, tenantId: string): void {
//         const state = this.userStates.get(userId);
//         if (state) {
//             state.activeUploads = Math.max(0, state.activeUploads - 1);
//             const tenantUploads = state.tenantUploads?.get(tenantId) || 0;
//             if (tenantUploads > 0) {
//                 state.tenantUploads?.set(tenantId, tenantUploads - 1);
//             }
//         }
//     }

//     public async cleanup(): Promise<void> {
//         const now = Date.now();
//         const staleTimeout = this.config.windowMs * 2;

//         for (const [userId, state] of this.userStates.entries()) {
//             if (now - state.lastReset > staleTimeout && state.activeUploads === 0) {
//                 this.userStates.delete(userId);
//             }
//         }
//     }

//     private emitRateLimitEvent(
//         userId: string, 
//         type: 'limit_exceeded' | 'burst_used' | 'connection_accepted',
//         metadata: any
//     ): void {
//         this.emit(type, {
//             userId,
//             timestamp: Date.now(),
//             ...metadata
//         });

//         monitoringManager.metrics.recordMetric(
//             MetricCategory.SECURITY,
//             'rate_limit',
//             type,
//             1,
//             MetricType.COUNTER,
//             metadata
//         );
//     }

//     private getTenantLimit(userTier: string): number {
//         switch (userTier) {
//             case 'enterprise':
//                 return 100;
//             case 'premium':
//                 return 50;
//             default:
//                 return 10;
//         }
//     }
// }

// export const rateLimiter = UploadRateLimiter.getInstance({
//     windowMs: 60000,
//     maxRequestsPerWindow: 100,
//     maxConcurrentUploads: 3,
//     burstLimit: 5,
//     userTierLimits: {
//         free: 3,
//         premium: 10,
//         enterprise: 50
//     }
// });