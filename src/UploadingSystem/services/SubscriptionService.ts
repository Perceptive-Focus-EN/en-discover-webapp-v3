// src/UploadingSystem/services/SubscriptionService.ts

import { EventEmitter } from 'events';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType } from '@/MonitoringSystem/constants/metrics';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { AuthenticatedWebSocket } from '../middleware/socketAuthMiddleware';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
    apiVersion: '2023-10-16' 
});

export enum SubscriptionType {
    DISCOUNTED = 'DISCOUNTED',
    BETA = 'BETA',
    TRIAL = 'TRIAL',
    PAID = 'PAID',
    UNLOCKED = 'UNLOCKED'
}

interface SubscriptionLimits {
    storage: {
        max: number;
        warning: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        maxConcurrent: number;
        burstLimit: number;
        tenantLimit: number;
        cooldownMs: number;
    };
    security: {
        costs: {
            perRequest: number;
            burstPenalty: number;
            overagePenalty: number;
        };
        thresholds: {
            suspiciousRateMultiplier: number;
            blacklistThreshold: number;
            anomalyDetection: {
                maxDeviation: number;
                samplingRate: number;
            };
        };
    };
    pricing: {
        monthly: number;
        yearly: number;
        currency: string;
    };
    features: string[];
}

const SUBSCRIPTION_LIMITS: Record<SubscriptionType, SubscriptionLimits> = {
    [SubscriptionType.TRIAL]: {
        storage: {
            max: 5 * 1024 * 1024 * 1024, // 5GB
            warning: 4.5 * 1024 * 1024 * 1024
        },
        rateLimit: {
            windowMs: 60000,
            maxRequests: 50,
            maxConcurrent: 2,
            burstLimit: 3,
            tenantLimit: 5,
            cooldownMs: 1000
        },
        security: {
            costs: {
                perRequest: 1,
                burstPenalty: 2,
                overagePenalty: 3
            },
            thresholds: {
                suspiciousRateMultiplier: 2,
                blacklistThreshold: 10,
                anomalyDetection: {
                    maxDeviation: 0.1,
                    samplingRate: 1
                }
            }
        },
        pricing: {
            monthly: 0,
            yearly: 0,
            currency: 'USD'
        },
        features: ['Basic Support']
    },
    [SubscriptionType.DISCOUNTED]: {
        storage: {
            max: 20 * 1024 * 1024 * 1024, // 20GB
            warning: 18 * 1024 * 1024 * 1024
        },
        rateLimit: {
            windowMs: 60000,
            maxRequests: 100,
            maxConcurrent: 5,
            burstLimit: 10,
            tenantLimit: 20,
            cooldownMs: 1000
        },
        security: {
            costs: {
                perRequest: 0.75,
                burstPenalty: 1.75,
                overagePenalty: 2.5
            },
            thresholds: {
                suspiciousRateMultiplier: 2.5,
                blacklistThreshold: 15,
                anomalyDetection: {
                    maxDeviation: 0.15,
                    samplingRate: 0.75
                }
            }
        },
        pricing: {
            monthly: 9.99,
            yearly: 99.99,
            currency: 'USD'
        },
        features: ['Basic Support', 'Email Support', 'API Access']
    },
    [SubscriptionType.PAID]: {
        storage: {
            max: 100 * 1024 * 1024 * 1024, // 100GB
            warning: 90 * 1024 * 1024 * 1024
        },
        rateLimit: {
            windowMs: 60000,
            maxRequests: 500,
            maxConcurrent: 20,
            burstLimit: 50,
            tenantLimit: 100,
            cooldownMs: 500
        },
        security: {
            costs: {
                perRequest: 0.5,
                burstPenalty: 1.5,
                overagePenalty: 2
            },
            thresholds: {
                suspiciousRateMultiplier: 3,
                blacklistThreshold: 20,
                anomalyDetection: {
                    maxDeviation: 0.2,
                    samplingRate: 0.5
                }
            }
        },
        pricing: {
            monthly: 29.99,
            yearly: 299.99,
            currency: 'USD'
        },
        features: ['Premium Support', '24/7 Email Support', 'Advanced API Access', 'Custom Integration']
    },
    [SubscriptionType.UNLOCKED]: {
        storage: {
            max: 1024 * 1024 * 1024 * 1024, // 1TB
            warning: 900 * 1024 * 1024 * 1024
        },
        rateLimit: {
            windowMs: 60000,
            maxRequests: 2000,
            maxConcurrent: 100,
            burstLimit: 200,
            tenantLimit: 500,
            cooldownMs: 250
        },
        security: {
            costs: {
                perRequest: 0.25,
                burstPenalty: 1,
                overagePenalty: 1.5
            },
            thresholds: {
                suspiciousRateMultiplier: 4,
                blacklistThreshold: 30,
                anomalyDetection: {
                    maxDeviation: 0.25,
                    samplingRate: 0.25
                }
            }
        },
        pricing: {
            monthly: 99.99,
            yearly: 999.99,
            currency: 'USD'
        },
        features: ['Enterprise Support', 'Dedicated Account Manager', 'Custom Solutions', 'SLA Guarantee']
    },
    [SubscriptionType.BETA]: {
        storage: {
            max: 50 * 1024 * 1024 * 1024, // 50GB
            warning: 45 * 1024 * 1024 * 1024
        },
        rateLimit: {
            windowMs: 60000,
            maxRequests: 200,
            maxConcurrent: 10,
            burstLimit: 20,
            tenantLimit: 50,
            cooldownMs: 750
        },
        security: {
            costs: {
                perRequest: 0.75,
                burstPenalty: 1.75,
                overagePenalty: 2.5
            },
            thresholds: {
                suspiciousRateMultiplier: 2.5,
                blacklistThreshold: 15,
                anomalyDetection: {
                    maxDeviation: 0.15,
                    samplingRate: 0.75
                }
            }
        },
        pricing: {
            monthly: 0,
            yearly: 0,
            currency: 'USD'
        },
        features: ['Beta Features', 'Community Support', 'Early Access']
    }
};

interface UserUploadState {
    requests: number;
    lastReset: number;
    activeUploads: number;
    burstCredits: number;
    uploadSizes: number[];
    tenantUploads: Map<string, number>;
    lastCalculated?: Date;
    warningsSent?: Set<string>;
    subscriptionType?: SubscriptionType;
}

interface SubscriptionSessionData {
    userId: string;
    targetType: SubscriptionType;
    status: 'pending' | 'complete' | 'expired';
    createdAt: Date;
    retryCount?: number;
    lastAttempt?: Date;
    customerId?: string;
    paymentMethodId?: string;
}

export class SubscriptionService extends EventEmitter {
    private static instance: SubscriptionService;
    private userStates = new Map<string, UserUploadState>();
    private checkoutSessions = new Map<string, SubscriptionSessionData>();
    private readonly MAX_RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAY_MS = 5000;

    public static getInstance(): SubscriptionService {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }

    private constructor() {
        super();
    }

    private async cleanupOldSessions(): Promise<void> {
        const now = Date.now();
        for (const [sessionId, session] of this.checkoutSessions) {
            if (now - session.createdAt.getTime() > 24 * 60 * 60 * 1000) {
                this.checkoutSessions.delete(sessionId);
            }
        }
    }

    private async updateUserSubscription(userId: string, subscriptionType: SubscriptionType): Promise<void> {
        // Update the user's subscription type in the database or any persistent storage
        // This is a placeholder implementation and should be replaced with actual logic
        const userState = await this.getOrCreateUserState(userId);
        userState.subscriptionType = subscriptionType;

        // Emit an event or log the subscription update
        this.emit('subscriptionUpdated', { userId, subscriptionType });
        monitoringManager.logger.info('User subscription updated', { userId, subscriptionType });
        // Implement the logic to update the user's subscription type
        // This is a placeholder implementation
        console.log(`Updating user ${userId} to subscription type ${subscriptionType}`);
    }

    private async handleFailedPayment(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
                const userId = (customer as Stripe.Customer).metadata.userId;
                const session = Array.from(this.checkoutSessions.values())
                    .find(s => s.customerId === customerId);

                if (session && session.retryCount && session.retryCount < this.MAX_RETRY_ATTEMPTS) {
                    await this.retryPayment(session, invoice.payment_intent as string);
                } else {
                    await this.handlePaymentFailure(userId, customerId, invoice.id);
                }
            }
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.PAYMENT_RETRY_FAILED, {
                customerId,
                invoiceId: invoice.id
            });
        }
    }

    private async retryPayment(session: SubscriptionSessionData, paymentIntentId: string): Promise<void> {
        try {
            session.retryCount = (session.retryCount || 0) + 1;
            session.lastAttempt = new Date();

            await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: session.paymentMethodId
            });

            monitoringManager.logger.info('Payment retry initiated', {
                userId: session.userId,
                attempt: session.retryCount
            });
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.PAYMENT_RETRY_FAILED, {
                userId: session.userId,
                sessionId: session.customerId
            });
        }
    }

    private async handlePaymentFailure(userId: string, customerId: string, invoiceId: string): Promise<void> {
        try {
            await this.updateUserSubscription(userId, SubscriptionType.TRIAL);

            const userWs = this.getUserWebSocket(userId);
            if (userWs) {
                userWs.send(JSON.stringify({
                    type: 'PAYMENT_FAILED',
                    message: 'Your payment has failed. Your subscription has been downgraded.',
                    retryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/retry?invoice=${invoiceId}`
                }));
            }

            this.emitMetric('payment_failed', userId, {
                customerId,
                invoiceId,
                timestamp: new Date()
            });
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.PAYMENT_FAILED, {
                userId,
                customerId,
                invoiceId
            });
        }
    }

    private emitMetric(event: string, userId: string, data: Record<string, any>): void {
        monitoringManager.logger.info(event, {
            userId,
            ...data
        });
    }

    private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
        const customerId = subscription.customer as string;
        try {
            const customer = await stripe.customers.retrieve(customerId);
            const userId = (customer as Stripe.Customer).metadata?.userId;
            const subscriptionType = this.determineSubscriptionType(subscription);

            await this.updateUserSubscription(userId, subscriptionType);

            const userWs = this.getUserWebSocket(userId);
            if (userWs) {
                userWs.send(JSON.stringify({
                    type: 'SUBSCRIPTION_UPDATED',
                    subscription: {
                        type: subscriptionType,
                        status: subscription.status,
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
                    }
                }));
            }
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.SUBSCRIPTION_UPGRADE_FAILED, {
                customerId,
                subscriptionId: subscription.id
            });
        }
    }

    private determineSubscriptionType(subscription: Stripe.Subscription): SubscriptionType {
        const priceId = subscription.items.data[0]?.price.id;
        return SubscriptionType.PAID; // Default fallback
    }

    private getUserWebSocket(userId: string): AuthenticatedWebSocket | undefined {
        return undefined;
    }

    public async checkSubscriptionStatus(userId: string): Promise<{
        type: SubscriptionType;
        isActive: boolean;
        expiresAt: Date;
        features: string[];
    }> {
        try {
            return {
                type: SubscriptionType.TRIAL,
                isActive: true,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                features: SUBSCRIPTION_LIMITS[SubscriptionType.TRIAL].features
            };
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.SUBSCRIPTION_STATUS_CHECK_FAILED, {
                userId
            });
            throw error;
        }
    }

    private async getOrCreateUserState(userId: string): Promise<UserUploadState> {
        let state = this.userStates.get(userId);
        if (!state) {
            state = {
                requests: 0,
                lastReset: Date.now(),
                activeUploads: 0,
                burstCredits: 0,
                uploadSizes: [],
                tenantUploads: new Map<string, number>()
            };
            this.userStates.set(userId, state);
        }
        return state;
    }

    async checkUploadAllowed(
        userId: string, 
        tenantId: string,
        fileSize: number,
        subscriptionType: SubscriptionType
    ): Promise<{
        allowed: boolean;
        reason?: string;
        shouldUpgrade?: boolean;
    }> {
        const abuseCheck = await this.checkForAbusePatterns(userId, tenantId, 'upload');
        if (!abuseCheck) {
            return {
                allowed: false,
                reason: 'Suspicious activity detected',
                shouldUpgrade: false
            };
        }

        const state = await this.getOrCreateUserState(userId);
        const limits = SUBSCRIPTION_LIMITS[subscriptionType];

        return {
            allowed: true,
            shouldUpgrade: false
        };
    }

    private async checkForAbusePatterns(userId: string, tenantId: string, action: string): Promise<boolean> {
        return true;
    }

    private async handleSuccessfulUpgrade(
        ws: AuthenticatedWebSocket, 
        session: Stripe.Checkout.Session
    ): Promise<void> {
        const state = await this.getOrCreateUserState(ws.userId);
        state.warningsSent?.clear();
        state.lastReset = Date.now();
        const newType: SubscriptionType = SubscriptionType.PAID; // Replace with actual logic to determine newType
        state.burstCredits = SUBSCRIPTION_LIMITS[newType].rateLimit.burstLimit;
    }
}

export const subscriptionService = SubscriptionService.getInstance();
