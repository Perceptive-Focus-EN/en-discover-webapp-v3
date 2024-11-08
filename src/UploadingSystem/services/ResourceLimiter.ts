// src/UploadingSystem/services/ResourceLimiter.ts
import { EventEmitter } from 'events';

interface ResourceLimits {
    storage: {
        maxSize: number;      // in bytes
        maxFiles: number;
    };
    aiCredits: {
        dailyLimit: number;
        maxTokens: number;
    };
    uploads: {
        concurrent: number;
        dailyLimit: number;
    };
}

export interface TierLimits {
    free: ResourceLimits;
    premium: ResourceLimits;
    enterprise: ResourceLimits;
}

export const TIER_LIMITS: TierLimits = {
    free: {
        storage: {
            maxSize: 1_000_000_000,  // 1GB
            maxFiles: 100
        },
        aiCredits: {
            dailyLimit: 100,
            maxTokens: 1000
        },
        uploads: {
            concurrent: 3,
            dailyLimit: 50
        }
    },
    premium: {
        storage: {
            maxSize: 10_000_000_000,  // 10GB
            maxFiles: 1000
        },
        aiCredits: {
            dailyLimit: 1000,
            maxTokens: 2000
        },
        uploads: {
            concurrent: 10,
            dailyLimit: 200
        }
    },
    enterprise: {
        storage: {
            maxSize: 100_000_000_000,  // 100GB
            maxFiles: 10000
        },
        aiCredits: {
            dailyLimit: 10000,
            maxTokens: 4000
        },
        uploads: {
            concurrent: 50,
            dailyLimit: 1000
        }
    }
};

export class ResourceLimiter extends EventEmitter {
    private static instance: ResourceLimiter | null = null;
    private userResources = new Map<string, {
        storage: number;
        aiCredits: number;
        uploadCount: number;
        lastReset: Date;
    }>();

    static getInstance(): ResourceLimiter {
        if (!this.instance) {
            this.instance = new ResourceLimiter();
        }
        return this.instance;
    }

    async checkResourceLimit(
        userId: string,
        tenantId: string,
        userTier: 'free' | 'premium' | 'enterprise',
        resourceType: 'storage' | 'aiCredits' | 'uploads',
        amount: number
    ): Promise<{ allowed: boolean; reason?: string; upgrade?: boolean }> {
        const limits = TIER_LIMITS[userTier];
        const userResource = this.getUserResource(userId);

        switch (resourceType) {
            case 'storage':
                if (userResource.storage + amount > limits.storage.maxSize) {
                    return {
                        allowed: false,
                        reason: 'Storage limit exceeded',
                        upgrade: true
                    };
                }
                break;

            case 'aiCredits':
                if (userResource.aiCredits + amount > limits.aiCredits.dailyLimit) {
                    return {
                        allowed: false,
                        reason: 'Daily AI credits limit exceeded',
                        upgrade: true
                    };
                }
                break;

            case 'uploads':
                if (userResource.uploadCount >= limits.uploads.dailyLimit) {
                    return {
                        allowed: false,
                        reason: 'Daily upload limit exceeded',
                        upgrade: true
                    };
                }
                break;
        }

        // Emit event for monitoring
        this.emit('resource:check', {
            userId,
            tenantId,
            resourceType,
            amount,
            currentUsage: userResource,
            limits: limits[resourceType]
        });

        return { allowed: true };
    }

    private getUserResource(userId: string) {
        if (!this.userResources.has(userId)) {
            this.userResources.set(userId, {
                storage: 0,
                aiCredits: 0,
                uploadCount: 0,
                lastReset: new Date()
            });
        }
        return this.userResources.get(userId)!;
    }
}


