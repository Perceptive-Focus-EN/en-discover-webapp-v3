// // src/UploadingSystem/services/ResourceQuotaManager.ts
// import { EventEmitter } from 'events';
// import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
// import { AuthenticatedWebSocket } from '../../middleware/socketAuthMiddleware';

// interface QuotaLimits {
//     storage: {
//         maxSize: number;
//         warningThreshold: number;
//         softLimit: number;
//         hardLimit: number;
//         temporary?: { amount: number; expiresAt: Date };
//         reserved?: { amount: number; purpose: string; expiresAt: Date }[];
//     };
//     aiCredits: { daily: number; monthly: number; burstLimit: number; warningThreshold: number };
//     uploads: {
//         concurrent: { active: number; limit: number };
//         daily: { count: number; limit: number; resetAt: Date };
//         monthly: number;
//         bandwidth: { used: number; limit: number; period: 'hourly' | 'daily' };
//         sizeLimits: { perFile: number; total: number };
//     };
//     features: {
//         chunking: { maxSize: number; concurrent: number };
//         processing: { enabled: boolean; types: string[] };
//     };
// }

// export class ResourceQuotaManager extends EventEmitter {
//     private static instance: ResourceQuotaManager | null = null;
//     private quotaUsage = new Map<string, {
//         userId: string;
//         tenantId: string;
//         usage: Partial<QuotaLimits>;
//         lastUpdated: Date;
//         graceOverages: Map<string, { amount: number; expiresAt: Date }>;
//     }>();

//     static getInstance(): ResourceQuotaManager {
//         if (!this.instance) {
//             this.instance = new ResourceQuotaManager();
//         }
//         return this.instance;
//     }

//     async checkAndHandleQuota(
//         ws: AuthenticatedWebSocket,
//         resourceType: keyof QuotaLimits,
//         amount: number
//     ): Promise<{ allowed: boolean; gracePeriod?: boolean }> {
//         const userKey = `${ws.tenantId}:${ws.userId}`;
//         const quotaState = await this.getQuotaState(userKey);
//         const limits = this.getQuotaLimits(ws.userTier);

//         if (this.isOverLimit(quotaState.usage, limits[resourceType], resourceType)) {
//             const hasGracePeriod = await this.checkGracePeriod(userKey, resourceType);
//             if (hasGracePeriod) {
//                 await this.handleGracePeriodUsage(ws, resourceType);
//                 return { allowed: true, gracePeriod: true };
//             }
//             await this.handleQuotaExceeded(ws, resourceType);
//             return { allowed: false };
//         }

//         await this.updateUsageMetrics(userKey, resourceType, amount);
//         return { allowed: true };
//     }

//     private async handleGracePeriodUsage(ws: AuthenticatedWebSocket, resourceType: keyof QuotaLimits): Promise<void> {
//         console.log(`Grace period for user ${ws.userId} on resource ${resourceType}`);
//     }

//     private async handleQuotaExceeded(ws: AuthenticatedWebSocket, resourceType: keyof QuotaLimits): Promise<void> {
//         console.log(`Quota exceeded for user ${ws.userId} on resource ${resourceType}`);
//     }

//     private async getQuotaState(userKey: string) {
//         let quotaState = this.quotaUsage.get(userKey);
//         if (!quotaState) {
//             quotaState = {
//                 userId: userKey.split(':')[1],
//                 tenantId: userKey.split(':')[0],
//                 usage: {},
//                 lastUpdated: new Date(),
//                 graceOverages: new Map()
//             };
//             this.quotaUsage.set(userKey, quotaState);
//         }
//         return quotaState;
//     }

//     private async checkGracePeriod(userKey: string, resourceType: keyof QuotaLimits): Promise<boolean> {
//         const quotaState = await this.getQuotaState(userKey);
//         const graceOverage = quotaState.graceOverages.get(resourceType as string);
//         return graceOverage && graceOverage.expiresAt > new Date();
//     }

//     private getQuotaLimits(userTier: string): QuotaLimits {
//         return {
//             storage: { maxSize: 1000, warningThreshold: 80, softLimit: 900, hardLimit: 1000 },
//             aiCredits: { daily: 100, monthly: 3000, burstLimit: 500, warningThreshold: 80 },
//             uploads: {
//                 concurrent: { active: 0, limit: 10 },
//                 daily: { count: 0, limit: 100, resetAt: new Date() },
//                 monthly: 1000,
//                 bandwidth: { used: 0, limit: 10000, period: 'daily' },
//                 sizeLimits: { perFile: 100, total: 1000 }
//             },
//             features: {
//                 chunking: { maxSize: 100, concurrent: 5 },
//                 processing: { enabled: true, types: ['image', 'video'] }
//             }
//         };
//     }

//     private async updateUsageMetrics(userKey: string, resourceType: keyof QuotaLimits, amount: number): Promise<void> {
//         const quotaState = await this.getQuotaState(userKey);
//         const usage = quotaState.usage[resourceType] || {};
//         if (resourceType === 'storage') {
//             usage.maxSize = (usage.maxSize || 0) + amount;
//         } else if (resourceType === 'uploads') {
//             usage.concurrency = (usage.concurrency || 0) + 1;
//         }
//         quotaState.usage[resourceType] = usage;
//         quotaState.lastUpdated = new Date();
//     }

//     private isOverLimit(usage: Partial<QuotaLimits>, limits: QuotaLimits[keyof QuotaLimits], resourceType: keyof QuotaLimits): boolean {
//         if (resourceType === 'storage' && usage.storage) {
//             return usage.storage.maxSize > limits.storage.hardLimit;
//         }
//         if (resourceType === 'aiCredits' && usage.aiCredits) {
//             return usage.aiCredits.daily > limits.aiCredits.daily;
//         }
//         if (resourceType === 'uploads' && usage.uploads) {
//             return usage.uploads.daily.count > limits.uploads.daily.limit;
//         }
//         return false;
//     }
// }

// export const resourceQuotaManager = ResourceQuotaManager.getInstance();
