// src/UploadingSystem/services/BlobLeaseService.ts

import { BlockBlobClient } from '@azure/storage-blob';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { EventEmitter } from 'events';

export const LEASE_EVENTS = {
    ACQUIRED: 'LEASE_ACQUIRED',
    RENEWED: 'LEASE_RENEWED',
    RELEASED: 'LEASE_RELEASED',
    FAILED: 'LEASE_FAILED',
    BROKEN: 'LEASE_BROKEN'
} as const;

export interface LeaseInfo {
    leaseId: string;
    trackingId: string;
    expiresAt: number;
    renewalInterval?: NodeJS.Timeout;
}

export class BlobLeaseService extends EventEmitter {
    private static instance: BlobLeaseService | null = null;
    private activeLeases = new Map<string, LeaseInfo>();
    private activeConnections = new Set<string>();
    private readonly LEASE_DURATION = 60; // 60 seconds
    private readonly RENEWAL_BUFFER = 30; // Increased buffer
    private cleanupInProgress = new Set<string>();

    private constructor() {
        super();
    }

    static getInstance(): BlobLeaseService {
        if (!this.instance) {
            this.instance = new BlobLeaseService();
        }
        return this.instance;
    }

    private async cleanupConnections(trackingId: string) {
        if (this.activeConnections.has(trackingId)) {
            this.activeConnections.delete(trackingId);
            monitoringManager.metrics.recordMetric(
                MetricCategory.SYSTEM,
                'blob_storage',
                'connection_cleanup',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                { trackingId }
            );
        }
    }

    async acquireLease(
        blockBlobClient: BlockBlobClient,
        trackingId: string,
        autoRenew = true
    ): Promise<string> {
        try {
            const leaseClient = blockBlobClient.getBlobLeaseClient();
            
            // Check and break existing lease
            try {
                const properties = await blockBlobClient.getProperties();
                if (properties.leaseState === 'leased') {
                    await leaseClient.breakLease(0);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                // Ignore if blob doesn't exist
            }

            // Acquire new lease
            const lease = await leaseClient.acquireLease(this.LEASE_DURATION);
            const leaseInfo: LeaseInfo = {
                leaseId: lease.leaseId as string,
                trackingId,
                expiresAt: Date.now() + (this.LEASE_DURATION * 1000)
            };

            if (autoRenew) {
                leaseInfo.renewalInterval = setInterval(
                    () => {
                        if (lease.leaseId) {
                            this.renewLease(blockBlobClient, lease.leaseId, trackingId);
                        }
                    },
                    (this.LEASE_DURATION - this.RENEWAL_BUFFER) * 1000
                );
            }

            this.activeLeases.set(trackingId, leaseInfo);

            this.emit(LEASE_EVENTS.ACQUIRED, {
                trackingId,
                leaseId: lease.leaseId
            });

            monitoringManager.metrics.recordMetric(
                MetricCategory.SYSTEM,
                'blob_storage',
                'lease_acquired',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                { trackingId }
            );

            return lease.leaseId || '';

        } catch (error) {
            this.emit(LEASE_EVENTS.FAILED, {
                trackingId,
                error
            });
            throw error;
        }
    }

    private async renewLease(
        blockBlobClient: BlockBlobClient,
        leaseId: string,
        trackingId: string
    ): Promise<void> {
        if (this.cleanupInProgress.has(trackingId)) {
            return;
        }

        try {
            const leaseClient = blockBlobClient.getBlobLeaseClient(leaseId);
            await leaseClient.renewLease();

            const leaseInfo = this.activeLeases.get(trackingId);
            if (leaseInfo) {
                leaseInfo.expiresAt = Date.now() + (this.LEASE_DURATION * 1000);
            }

            this.emit(LEASE_EVENTS.RENEWED, {
                trackingId,
                leaseId
            });

            monitoringManager.metrics.recordMetric(
                MetricCategory.SYSTEM,
                'blob_storage',
                'lease_renewed',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                { trackingId }
            );

        } catch (error) {
            // If renewal fails, try to reacquire
            try {
                await this.reacquireLease(blockBlobClient, trackingId);
            } catch (reacquireError) {
                this.emit(LEASE_EVENTS.FAILED, {
                    trackingId,
                    leaseId,
                    error: reacquireError,
                    operation: 'renew_and_reacquire'
                });
            }
        }
    }

    private async reacquireLease(
        blockBlobClient: BlockBlobClient,
        trackingId: string
    ): Promise<void> {
        try {
            await this.breakLease(blockBlobClient, trackingId);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.acquireLease(blockBlobClient, trackingId, true);
        } catch (error) {
            throw error;
        }
    }

    async releaseLease(
        blockBlobClient: BlockBlobClient,
        trackingId: string
    ): Promise<void> {
        this.cleanupInProgress.add(trackingId);
        const leaseInfo = this.activeLeases.get(trackingId);
        if (!leaseInfo) return;

        try {
            if (leaseInfo.renewalInterval) {
                clearInterval(leaseInfo.renewalInterval);
                leaseInfo.renewalInterval = undefined;
            }

            const leaseClient = blockBlobClient.getBlobLeaseClient(leaseInfo.leaseId);
            await leaseClient.releaseLease();

            this.activeLeases.delete(trackingId);
            this.emit(LEASE_EVENTS.RELEASED, {
                trackingId,
                leaseId: leaseInfo.leaseId
            });

            monitoringManager.metrics.recordMetric(
                MetricCategory.SYSTEM,
                'blob_storage',
                'lease_released',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                { trackingId }
            );

        } catch (error) {
            // If release fails, try to break
            try {
                await this.breakLease(blockBlobClient, trackingId);
            } catch (breakError) {
                // Log both errors
                this.emit(LEASE_EVENTS.FAILED, {
                    trackingId,
                    error: [error, breakError],
                    operation: 'release_and_break'
                });
            }
        } finally {
            this.cleanupInProgress.delete(trackingId);
        }
    }

    async breakLease(
        blockBlobClient: BlockBlobClient,
        trackingId: string
    ): Promise<void> {
        try {
            const leaseClient = blockBlobClient.getBlobLeaseClient();
            await leaseClient.breakLease(0);

            this.emit(LEASE_EVENTS.BROKEN, {
                trackingId
            });

            monitoringManager.metrics.recordMetric(
                MetricCategory.SYSTEM,
                'blob_storage',
                'lease_broken',
                1,
                MetricType.COUNTER,
                MetricUnit.COUNT,
                { trackingId }
            );

        } catch (error) {
            this.emit(LEASE_EVENTS.FAILED, {
                trackingId,
                error,
                operation: 'break'
            });
            throw error;
        }
    }

    isLeaseActive(trackingId: string): boolean {
        const leaseInfo = this.activeLeases.get(trackingId);
        if (!leaseInfo) return false;
        return Date.now() < leaseInfo.expiresAt;
    }

    getLeaseId(trackingId: string): string | undefined {
        return this.activeLeases.get(trackingId)?.leaseId;
    }


    cleanup(trackingId: string): void {
        this.cleanupInProgress.add(trackingId);
        try {
            const leaseInfo = this.activeLeases.get(trackingId);
            if (leaseInfo?.renewalInterval) {
                clearInterval(leaseInfo.renewalInterval);
                leaseInfo.renewalInterval = undefined;
            }
            this.activeLeases.delete(trackingId);
            this.cleanupConnections(trackingId);
        } finally {
            this.cleanupInProgress.delete(trackingId);
        }
    }
}

export const blobLeaseService = BlobLeaseService.getInstance();