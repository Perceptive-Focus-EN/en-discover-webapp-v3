// src/UploadingSystem/services/ResourceQuotaManager.ts
import { EventEmitter } from 'events';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { AuthenticatedWebSocket } from '../middleware/socketAuthMiddleware';

interface QuotaLimits {
    storage: {
        maxSize: number;
        warningThreshold: number;  // Percentage
        softLimit: number;         // Grace period allowed
        hardLimit: number;         // Absolute max
        temporary?: {
            amount: number;
            expiresAt: Date;
        };
        reserved?: {
            amount: number;
            purpose: string;
            expiresAt: Date;
        }[];
    };
    aiCredits: {
        daily: number;
        monthly: number;
        burstLimit: number;        // Short-term spike allowance
        warningThreshold: number;
    };
    uploads: {
        concurrent: {
            active: number;
            limit: number;
        };
        daily: {
            count: number;
            limit: number;
            resetAt: Date;
        };
        monthly: number;
        bandwidth: {
            used: number;
            limit: number;
            period: 'hourly' | 'daily';
        };
        sizeLimits: {
            perFile: number;
            total: number;
        };
    };
    features: {
        chunking: {
            maxSize: number;
            concurrent: number;
        };
        processing: {
            enabled: boolean;
            types: string[];
        };
    };
}

interface UpgradeOffer {
    id: string;
    name: string;
    description: string;
    features: string[];
    price: number;
    savings?: number;
    quotaIncrease: Partial<QuotaLimits>;
    trialAvailable: boolean;
    validUntil?: Date;
}

interface QuotaUsageMetrics {
    peakUsage: {
        storage: number;
        bandwidth: number;
        timestamp: Date;
    };
    trends: {
        daily: number[];
        weekly: number[];
        monthly: number[];
    };
    patterns: {
        highUsageHours: number[];
        lowUsageHours: number[];
    };
}

export class ResourceQuotaManager extends EventEmitter {
    private static instance: ResourceQuotaManager | null = null;
    private quotaUsage = new Map<string, {
        userId: string;
        tenantId: string;
        usage: Partial<QuotaLimits>;
        lastUpdated: Date;
        graceOverages: Map<string, {
            amount: number;
            expiresAt: Date;
        }>;
    }>();

    private upgradeOffers = new Map<string, UpgradeOffer[]>();
    private usageMetrics = new Map<string, QuotaUsageMetrics>();

    static getInstance(): ResourceQuotaManager {
        if (!this.instance) {
            this.instance = new ResourceQuotaManager();
        }
        return this.instance;
    }

    async checkAndHandleQuota(
        ws: AuthenticatedWebSocket,
        resourceType: keyof QuotaLimits,
        amount: number,
        options: {
            priority?: 'high' | 'normal' | 'low';
            processingRequired?: boolean;
        } = {}
    ): Promise<{ 
        allowed: boolean; 
        gracePeriod?: boolean;
        waitTime?: number;
        suggestions?: any[] 
    }> {
        const userKey = `${ws.tenantId}:${ws.userId}`;
        const quotaState = await this.getQuotaState(userKey);
        const limits = this.getQuotaLimits(ws.userTier);

        // Check available storage with reservations
        if (resourceType === 'storage') {
            const availableStorage = await this.calculateAvailableStorage(
                quotaState.usage.storage!,
                options.priority
            );
            if (amount > availableStorage) {
                const suggestions = await this.generateQuotaSuggestions(
                    userKey,
                    'storage',
                    amount
                );
                return { allowed: false, suggestions };
            }
        }

        // Check bandwidth and concurrent limits
        if (resourceType === 'uploads') {
            const { allowed: concurrentAllowed, waitTime } = 
                await this.checkConcurrentLimit(quotaState.usage.uploads!, options.priority);
            
            if (!concurrentAllowed) {
                return { allowed: false, waitTime };
            }

            // Check bandwidth quota
            const bandwidthAllowed = await this.checkBandwidthQuota(
                quotaState.usage.uploads!,
                amount
            );
            if (!bandwidthAllowed) {
                return {
                    allowed: false,
                    waitTime: await this.calculateBandwidthResetTime(quotaState.usage.uploads!)
                };
            }
        }

        // Check if over limit
        if (this.isOverLimit(quotaState.usage, limits[resourceType])) {
            const hasGracePeriod = await this.checkGracePeriod(userKey, resourceType);
            if (hasGracePeriod) {
                await this.handleGracePeriodUsage(ws, resourceType);
                return { allowed: true, gracePeriod: true };
            }

            await this.handleQuotaExceeded(ws, resourceType);
            return { allowed: false };
        }

        // Reserve quota if allowed
        if (resourceType === 'storage') {
            await this.reserveQuota(userKey, amount, options);
        }

        // Update usage metrics
        await this.updateUsageMetrics(userKey, resourceType, amount);

        return { allowed: true };
    }

    private async updateUsageMetrics(
        userKey: string,
        resourceType: keyof QuotaLimits,
        amount: number
    ): Promise<void> {
        let metrics = this.usageMetrics.get(userKey);
        if (!metrics) {
            metrics = {
                peakUsage: {
                    storage: 0,
                    bandwidth: 0,
                    timestamp: new Date()
                },
                trends: {
                    daily: new Array(30).fill(0),
                    weekly: new Array(12).fill(0),
                    monthly: new Array(12).fill(0)
                },
                patterns: {
                    highUsageHours: [],
                    lowUsageHours: []
                }
            };
        }

        // Update peak usage if necessary
        if (amount > metrics.peakUsage[resourceType === 'uploads' ? 'bandwidth' : 'storage']) {
            metrics.peakUsage[resourceType === 'uploads' ? 'bandwidth' : 'storage'] = amount;
            metrics.peakUsage.timestamp = new Date();
        }

        // Update usage patterns
        const hour = new Date().getHours();
        const currentUsage = this.quotaUsage.get(userKey)?.usage;
        if (currentUsage) {
            const usagePercentage = this.calculateUsagePercentage(currentUsage, resourceType);
            if (usagePercentage > 0.7) {
                metrics.patterns.highUsageHours = 
                    [...new Set([...metrics.patterns.highUsageHours, hour])];
            } else if (usagePercentage < 0.3) {
                metrics.patterns.lowUsageHours = 
                    [...new Set([...metrics.patterns.lowUsageHours, hour])];
            }
        }

        this.usageMetrics.set(userKey, metrics);
    }

    private async reserveQuota(
        userKey: string,
        amount: number,
        options: any
    ): Promise<void> {
        const quotaState = await this.getQuotaState(userKey);
        
        if (!quotaState.usage.storage!.reserved) {
            quotaState.usage.storage!.reserved = [];
        }

        quotaState.usage.storage!.reserved.push({
            amount,
            purpose: options.processingRequired ? 'processing' : 'upload',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        });

        await this.cleanupExpiredReservations(userKey);
    }

    private async generateQuotaSuggestions(
        userKey: string,
        resourceType: keyof QuotaLimits,
        required: number
    ): Promise<UpgradeOffer[]> {
        const metrics = this.usageMetrics.get(userKey);
        const currentUsage = this.quotaUsage.get(userKey);
        
        if (!metrics || !currentUsage) return [];

        const suggestions: UpgradeOffer[] = [];

        // Temporary quota increase
        if (required < currentUsage.usage.storage!.maxSize * 0.2) {
            suggestions.push({
                id: `temp_${Date.now()}`,
                name: '24-Hour Boost',
                description: 'Temporary quota increase for 24 hours',
                features: ['No long-term commitment', 'Instant activation'],
                price: this.calculateTemporaryQuotaCost(required),
                quotaIncrease: {
                    storage: {
                        maxSize: required * 1.2,
                        warningThreshold: 0.9,
                        softLimit: required * 1.2,
                        hardLimit: required * 1.2
                    }
                },
                trialAvailable: false,
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
        }

        // Permanent upgrade
        suggestions.push({
            id: `perm_${Date.now()}`,
            name: 'Storage Plus',
            description: 'Permanent quota increase',
            features: [
                'No expiration',
                'Priority support',
                'Enhanced processing features'
            ],
            price: this.calculatePermanentQuotaCost(required),
            quotaIncrease: {
                storage: {
                    maxSize: required * 2,
                    warningThreshold: 0.8,
                    softLimit: required * 2.2,
                    hardLimit: required * 2.5
                },
                features: {
                    processing: {
                        enabled: true,
                        types: ['image', 'video', 'document']
                    }
                }
            },
            trialAvailable: true
        });

        return suggestions;
    }

    // ... (previous helper methods remain the same)

    private calculateTemporaryQuotaCost(size: number): number {
        const baseRate = 0.05; // $0.05 per GB
        return Math.ceil(size / (1024 * 1024 * 1024) * baseRate);
    }

    private calculatePermanentQuotaCost(size: number): number {
        const baseRate = 0.10; // $0.10 per GB
        return Math.ceil(size / (1024 * 1024 * 1024) * baseRate);
    }

    private async cleanupExpiredReservations(userKey: string): Promise<void> {
        const quotaState = await this.getQuotaState(userKey);
        if (!quotaState.usage.storage!.reserved) return;

        quotaState.usage.storage!.reserved = quotaState.usage.storage!.reserved
            .filter(reservation => reservation.expiresAt > new Date());
    }

    private calculateUsagePercentage(
        usage: Partial<QuotaLimits>,
        resourceType: keyof QuotaLimits
    ): number {
        if (resourceType === 'storage') {
            return usage.storage!.maxSize / usage.storage!.hardLimit;
        }
        return 0;
    }
}

export const resourceQuotaManager = ResourceQuotaManager.getInstance();