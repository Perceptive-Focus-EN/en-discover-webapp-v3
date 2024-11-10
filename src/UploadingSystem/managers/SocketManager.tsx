// src/UploadingSystem/managers/SocketManager.ts
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { LoadBalancer } from '../services/LoadBalancer';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { socketAuthMiddleware, AuthenticatedWebSocket } from '../middleware/socketAuthMiddleware';
import { CircuitBreaker } from '@/MonitoringSystem/utils/CircuitBreaker';
import { SubscriptionService, SubscriptionType } from '../services/SubscriptionService';

export interface SocketManagerConfig {
    maxConnectionsPerNode: number;
    healthCheckInterval: number;
    metricsInterval: number;
    redistributionThreshold: number;
}

export interface NodeMetrics {
    connections: number;
    memory: number;
    cpu: number;
    latency: number;
    errors: number;
}

export interface Metadata {
    component: string;
    category: string;
    aggregationType?: 'latest' | 'average' | 'sum';
    uploadStats?: {
        activeUploads: number;
        queueSize: number;
        memoryUsage: number;
        chunkProgress: number;
    };
    circuitBreaker?: {
        socket_connection: boolean;
        resource_limit: boolean;
        rate_limit: boolean;
        payment_gateway: boolean;
        node_migration: boolean;
    };
}

export interface MigrationPlan {
    moves: Array<{
        connection: AuthenticatedWebSocket;
        fromNode: string;
        toNode: string;
    }>;
}

export class SocketManager extends EventEmitter {
    private static instance: SocketManager | null = null;
    private subscriptionService: SubscriptionService;
    private loadBalancer: LoadBalancer;
    private circuitBreaker: CircuitBreaker;
    private nodeMetrics: Map<string, NodeMetrics> = new Map();
    private readonly config: SocketManagerConfig;
    private connectionPool = new Map<string, { connections: Set<AuthenticatedWebSocket>; lastActivity: Date }>();

    private constructor() {
        super();
        this.config = {
            maxConnectionsPerNode: 100000,
            healthCheckInterval: 30000,
            metricsInterval: 10000,
            redistributionThreshold: 0.8
        };

        this.subscriptionService = SubscriptionService.getInstance();
        this.loadBalancer = LoadBalancer.getInstance({
            maxConnectionsPerNode: this.config.maxConnectionsPerNode,
            nodes: this.getAvailableNodes(),
            failoverStrategy: 'least-connections'
        });

        this.circuitBreaker = new CircuitBreaker();
        this.setupMetricsCollection();
        this.setupHealthChecks();
    }

    static getInstance(): SocketManager {
        if (!this.instance) {
            this.instance = new SocketManager();
        }
        return this.instance;
    }

    private setupMetricsCollection(): void {
        setInterval(() => {
            this.collectMetrics();
        }, this.config.metricsInterval);
    }

    private setupHealthChecks(): void {
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }

    public async shutdown(): Promise<void> {
        await this.drainConnections();
        await this.stopServices();
    }

    private async drainConnections(): Promise<void> {
        for (const { connections } of this.connectionPool.values()) {
            for (const ws of connections) {
                ws.close(1001, 'Server shutting down');
            }
        }
    }

    private async stopServices(): Promise<void> {
        // Logic to stop all services gracefully, such as cleaning up any ongoing operations or releasing resources
    }

    private async gatherNodeMetrics(): Promise<any> {
        // Implement the logic to gather node metrics here
        return {
            totalConnections: 0,
            activeUploads: 0,
            queueSize: 0,
            memoryUsage: 0,
            chunkProgress: 0
        };
    }

    private async collectMetrics(): Promise<void> {
        try {
            const metrics = await this.gatherNodeMetrics();

            const circuitStatuses = {
                socket_connection: this.circuitBreaker.isOpen('socket_connection'),
                subscription_check: this.circuitBreaker.isOpen('subscription_check'),
                node_migration: this.circuitBreaker.isOpen('node_migration'),
                resource_limit: this.circuitBreaker.isOpen('resource_limit'),
                rate_limit: this.circuitBreaker.isOpen('rate_limit'),
                payment_gateway: this.circuitBreaker.isOpen('payment_gateway')
            };

            monitoringManager.recordDashboardMetric({
                type: 'SYSTEM_HEALTH',
                timestamp: Date.now(),
                value: metrics.totalConnections,
                metadata: {
                    component: 'socket_manager',
                    category: 'connections',
                    aggregationType: 'latest',
                    uploadStats: {
                        activeUploads: metrics.activeUploads,
                        queueSize: metrics.queueSize,
                        memoryUsage: metrics.memoryUsage,
                        chunkProgress: metrics.chunkProgress
                    },
                    circuitBreaker: circuitStatuses
                }
            });

            if (this.shouldRebalance(metrics)) {
                await this.rebalanceNodes();
            }
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.METRICS_COLLECTION_FAILED, {
                component: 'SocketManager',
                timestamp: new Date()
            });
        }
    }

    private async checkNodesHealth(): Promise<string[]> {
        // Implement the logic to check the health of nodes and return an array of unhealthy node IDs
        return [];
    }

    private async performHealthChecks(): Promise<void> {
        try {
            const unhealthyNodes = await this.checkNodesHealth();
            if (unhealthyNodes.length > 0) {
                await this.handleUnhealthyNodes(unhealthyNodes);
            }
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.HEALTH_CHECK_FAILED, {
                component: 'SocketManager'
            });
        }
    }

    private async handleUnhealthyNodes(unhealthyNodes: string[]): Promise<void> {
        for (const nodeId of unhealthyNodes) {
            monitoringManager.logger.warn(`Node ${nodeId} is unhealthy. Taking necessary actions.`);
            // Implement the logic to handle unhealthy nodes, such as redistributing connections or notifying administrators
        }
    }

    public async handleConnection(ws: AuthenticatedWebSocket, request: any): Promise<boolean> {
        return this.executeWithCircuitBreaker('socket_connection', async () => {
            const isAuthenticated = await socketAuthMiddleware(ws, request);
            if (!isAuthenticated) return false;

            // Use SubscriptionService for checking limits
            const subscriptionCheck = await this.executeWithCircuitBreaker(
                'subscription_check',
                async () => this.subscriptionService.checkUploadAllowed(
                    ws.userId,
                    ws.tenantId,
                    0, // Initial connection doesn't have file size
                    ws.subscriptionType as SubscriptionType
                )
            );

            if (!subscriptionCheck.allowed) {
                if (subscriptionCheck.shouldUpgrade) {
                    // Send upgrade suggestion via WebSocket
                    ws.send(JSON.stringify({
                        type: 'UPGRADE_SUGGESTED',
                        reason: subscriptionCheck.reason,
                        currentType: ws.subscriptionType,
                        suggestedType: this.getNextSubscriptionTier(ws.subscriptionType as SubscriptionType)
                    }));
                }
                ws.close(4004, subscriptionCheck.reason || 'Subscription limit exceeded');
                return false;
            }

            // Manage connection in pool
            this.manageConnectionPool(ws);

            // Get best node for connection
            const bestNode = await this.loadBalancer.getBestNode(ws.subscriptionType as SubscriptionType);
            if (bestNode) {
                this.updateNodeMetrics(bestNode, ws);
            } else {
                monitoringManager.logger.warn('No available nodes for connection', {
                    userId: ws.userId,
                    subscriptionType: ws.subscriptionType
                });
                ws.close(4004, 'No available nodes');
                return false;
            }

            return true;
        });
    }

    private getNextSubscriptionTier(currentTier: SubscriptionType): SubscriptionType {
        const tiers = [
            SubscriptionType.TRIAL,
            SubscriptionType.DISCOUNTED,
            SubscriptionType.PAID,
            SubscriptionType.UNLOCKED
        ];
        
        const currentIndex = tiers.indexOf(currentTier);
        return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : currentTier;
    }

    private manageConnectionPool(ws: AuthenticatedWebSocket): void {
        const key = `${ws.userId}:${ws.tenantId}`;
        const connectionData = this.connectionPool.get(key) || { connections: new Set(), lastActivity: new Date() };
        connectionData.connections.add(ws);
        connectionData.lastActivity = new Date();
        this.connectionPool.set(key, connectionData);
    }

    private async executeWithCircuitBreaker<T>(
        circuitName: string,
        operation: () => Promise<T>
    ): Promise<T> {
        if (this.circuitBreaker.isOpen(circuitName)) {
            throw new Error(`Circuit ${circuitName} is open`);
        }

        try {
            const result = await operation();
            this.circuitBreaker.recordSuccess(circuitName);
            return result;
        } catch (error) {
            this.circuitBreaker.recordError(circuitName);
            throw error;
        }
    }

    private async rebalanceNodes(): Promise<void> {
        try {
            const plan = await this.loadBalancer.createRebalancePlan() as MigrationPlan;
            for (const move of plan.moves) {
                await this.migrateConnection(move.connection, move.fromNode, move.toNode);
            }
        } catch (error) {
            monitoringManager.logger.error(error, SystemError.NODE_MIGRATION_FAILED, {
                timestamp: new Date()
            });
        }
    }

    private async migrateConnection(
        connection: AuthenticatedWebSocket,
        fromNodeId: string,
        toNodeId: string
    ): Promise<void> {
        await this.executeWithCircuitBreaker('node_migration', async () => {
            try {
                connection.send(JSON.stringify({
                    type: 'MIGRATION_START',
                    toNode: toNodeId
                }));

                const acknowledged = await this.waitForMigrationAck(connection);
                if (!acknowledged) throw new Error('Migration acknowledgment timeout');

                await this.loadBalancer.moveConnection(connection, fromNodeId, toNodeId);

                this.updateNodeMetrics(toNodeId, connection);
                this.decrementNodeMetrics(fromNodeId, connection);

                connection.send(JSON.stringify({
                    type: 'MIGRATION_COMPLETE',
                    nodeId: toNodeId
                }));
            } catch (error) {
                monitoringManager.logger.error(error, SystemError.CONNECTION_MIGRATION_FAILED, {
                    fromNode: fromNodeId,
                    toNode: toNodeId,
                    connectionId: (connection as any).id
                });
                throw error;
            }
        });
    }

    private async waitForMigrationAck(connection: AuthenticatedWebSocket): Promise<boolean> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 5000);

            const handler = (message: string) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'MIGRATION_ACK') {
                        clearTimeout(timeout);
                        connection.removeListener('message', handler);
                        resolve(true);
                    }
                } catch {
                    // Ignore parsing errors
                }
            };

            connection.on('message', handler);
        });
    }

    private updateNodeMetrics(nodeId: string, connection: AuthenticatedWebSocket): void {
        const metrics = this.nodeMetrics.get(nodeId) || {
            connections: 0,
            memory: 0,
            cpu: 0,
            latency: 0,
            errors: 0
        };

        metrics.connections++;
        this.nodeMetrics.set(nodeId, metrics);
    }

    private decrementNodeMetrics(nodeId: string, connection: AuthenticatedWebSocket): void {
        const metrics = this.nodeMetrics.get(nodeId);
        if (metrics) {
            metrics.connections = Math.max(0, metrics.connections - 1);
            this.nodeMetrics.set(nodeId, metrics);
        }
    }

    private getAvailableNodes(): string[] {
        return process.env.SOCKET_NODES?.split(',') || ['default-node'];
    }

    private shouldRebalance(metrics: any): boolean {
        const maxConnections = this.config.maxConnectionsPerNode;
        const currentLoad = metrics.totalConnections / maxConnections;
        return currentLoad > this.config.redistributionThreshold;
    }
}

export const socketManager = SocketManager.getInstance();
