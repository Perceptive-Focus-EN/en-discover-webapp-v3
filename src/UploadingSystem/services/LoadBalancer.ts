// src/UploadingSystem/services/LoadBalancer.ts
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { AuthenticatedWebSocket } from '../middleware/socketAuthMiddleware';
import { EventEmitter } from 'events';
import { MigrationPlan } from '../managers/SocketManager';
import { SubscriptionType } from '../services/SubscriptionService';
import { MetricCategory, MetricType } from '@/MonitoringSystem/constants/metrics';

export interface LoadBalancerConfig {
    maxConnectionsPerNode: number;
    nodes: string[];
    failoverStrategy: 'round-robin' | 'least-connections';
}

export interface NodeStats {
    id: string;
    connections: Map<string, AuthenticatedWebSocket>;
    metrics: {
        cpu: number;
        memory: number;
        latency: number;
        errors: number;
        load: number;
    };
    status: 'active' | 'draining' | 'unhealthy';
    lastHealthCheck: Date;
}

export interface NodeUploads {
    active: number;
    queued: number;
    progress: number;
}

interface NodePreference {
    subscriptionTypes: SubscriptionType[];
    priority: number;
    maxLoad: number;
}

interface ScalingThresholds {
    cpu: number;
    memory: number;
    connections: number;
    loadAverage: number;
}

interface ScalingConfig {
    thresholds: {
        high: ScalingThresholds;
        critical: ScalingThresholds;
    };
    cooldownPeriod: number;  // Time between scaling actions
    scaleUpBy: number;       // Number of nodes to add
    scaleDownBy: number;     // Number of nodes to remove
}

interface NodeScalingState {
    lastScalingAction: Date;
    consecutiveHighLoads: number;
    cooldownUntil: Date;
}

interface LoadPattern {
    ratio: number;       // Current to baseline ratio
    trend: number;       // Rate of change
    timeWeight: number;  // Time period importance
}

interface ScalingState {
    baselineLoad: number;
    patterns: Map<string, LoadPattern>;
    lastScaling: Date;
    cooldown: boolean;
}

export class LoadBalancer extends EventEmitter {
    private static instance: LoadBalancer | null = null;
    private nodes: Map<string, NodeStats> = new Map();
    private readonly config: LoadBalancerConfig;
    private readonly nodePreferences: Record<string, NodePreference> = {
        'high-performance': {
            subscriptionTypes: [SubscriptionType.UNLOCKED, SubscriptionType.PAID],
            priority: 1,
            maxLoad: 0.7  // Keep some headroom for high-tier users
        },
        'standard': {
            subscriptionTypes: [SubscriptionType.DISCOUNTED, SubscriptionType.BETA],
            priority: 2,
            maxLoad: 0.8
        },
        'basic': {
            subscriptionTypes: [SubscriptionType.TRIAL],
            priority: 3,
            maxLoad: 0.9
        }
    };

    private nodeScalingState: NodeScalingState = {
        lastScalingAction: new Date(),
        consecutiveHighLoads: 0,
        cooldownUntil: new Date()
    };

    private readonly scalingConfig: ScalingConfig = {
        thresholds: {
            high: {
                cpu: 0.7,        // 70% CPU
                memory: 0.7,     // 70% Memory
                connections: 0.7, // 70% Connection capacity
                loadAverage: 0.7 // 70% Load average
            },
            critical: {
                cpu: 0.9,
                memory: 0.85,
                connections: 0.9,
                loadAverage: 0.85
            }
        },
        cooldownPeriod: 5 * 60 * 1000, // 5 minutes
        scaleUpBy: 1,
        scaleDownBy: 1
    };

    private scalingState: ScalingState = {
        baselineLoad: 0,
        patterns: new Map(),
        lastScaling: new Date(),
        cooldown: false
    };

    private readonly timeWindows = [
        { name: 'peak', weight: 1.5, hours: [9, 10, 11, 14, 15, 16] },
        { name: 'normal', weight: 1.0, hours: [8, 12, 13, 17] },
        { name: 'quiet', weight: 0.5, hours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7] }
    ];

    private constructor(config: LoadBalancerConfig) {
        super();
        this.config = config;
        this.initializeNodes();
        
        // Setup periodic scaling check
        setInterval(async () => {
            const action = await this.evaluateScaling();
            if (action) {
                await this.scaleCluster(action);
            }
        }, 60000); // Check every minute
    }

    static getInstance(config: LoadBalancerConfig): LoadBalancer {
        if (!this.instance) {
            this.instance = new LoadBalancer(config);
        }
        return this.instance;
    }

    private initializeNodes(): void {
        this.config.nodes.forEach(nodeId => {
            this.nodes.set(nodeId, {
                id: nodeId,
                connections: new Map(),
                metrics: {
                    cpu: 0,
                    memory: 0,
                    latency: 0,
                    errors: 0,
                    load: 0
                },
                status: 'active',
                lastHealthCheck: new Date()
            });
        });
    }

    public async createRebalancePlan(): Promise<MigrationPlan> {
        const activeNodes = Array.from(this.nodes.entries())
            .filter(([_, stats]) => stats.status === 'active');

        if (activeNodes.length < 2) {
            return { moves: [] };
        }

        const nodeIds = activeNodes.map(([nodeId]) => nodeId);
        const sourceNode = await this.getLeastLoadedNode(nodeIds);
        const targetNode = await this.getLeastLoadedNode(nodeIds.filter(id => id !== sourceNode));

        if (!sourceNode || !targetNode) {
            return { moves: [] };
        }

        const uploads = await this.getNodeUploads(sourceNode);
        const connections = await this.getNodeConnections(sourceNode);

        if (uploads.active > 0 || connections.length > 0) {
            return { moves: [] };
        }

        await this.drainNode(sourceNode);
        const connection = connections[0]; // Assuming you want to move the first connection
        return { moves: [{ connection, fromNode: sourceNode, toNode: targetNode }] };
    }

    public async getBestNode(subscriptionType: SubscriptionType): Promise<string | null> {
        const activeNodes = Array.from(this.nodes.entries())
            .filter(([_, stats]) => stats.status === 'active');

        if (activeNodes.length === 0) return null;

        // Get preferred nodes for subscription type
        const preferredNodes = activeNodes.filter(([nodeId]) => 
            this.isPreferredNode(nodeId, subscriptionType)
        );

        // If preferred nodes available and not overloaded, use them
        const bestNode = preferredNodes.length > 0 
            ? this.getLeastLoadedFromNodes(preferredNodes)
            : this.getLeastLoadedFromNodes(activeNodes);

        return bestNode?.id || null;
    }

    private isPreferredNode(nodeId: string, subscriptionType: SubscriptionType): boolean {
        const nodeType = this.getNodeType(nodeId);
        const preference = this.nodePreferences[nodeType];
        
        return preference.subscriptionTypes.includes(subscriptionType) &&
            this.getNodeLoad(nodeId) < preference.maxLoad;
    }

    private getLeastLoadedFromNodes(nodes: [string, NodeStats][]): NodeStats | null {
        return nodes.reduce((best, [_, current]) => {
            if (!best) return current;
            return current.metrics.load < best.metrics.load ? current : best;
        }, null as NodeStats | null);
    }

    private getNodeType(nodeId: string): string {
        // Implement logic to determine node type based on nodeId
        // For example, you might have a mapping of nodeId to nodeType
        return 'standard'; // Placeholder implementation
    }

    private getNodeLoad(nodeId: string): number {
        const node = this.nodes.get(nodeId);
        return node ? node.metrics.load : 0;
    }

    public async getLeastLoadedNode(nodes: string[]): Promise<string | null> {
        const availableNodes = nodes
            .map(id => this.nodes.get(id))
            .filter((node): node is NodeStats => 
                node !== undefined && node.status === 'active');

        if (availableNodes.length === 0) {
            return null;
        }

        return availableNodes.reduce((best, current) => 
            current.metrics.load < best.metrics.load ? current : best
        ).id;
    }

    public async getNodeUploads(nodeId: string): Promise<NodeUploads> {
        const node = this.nodes.get(nodeId);
        if (!node) {
            return { active: 0, queued: 0, progress: 0 };
        }

        const activeUploads = Array.from(node.connections.values())
            .filter(conn => (conn as any).isUploading)
            .length;

        return {
            active: activeUploads,
            queued: node.connections.size - activeUploads,
            progress: this.calculateNodeProgress(node)
        };
    }

    private calculateNodeProgress(node: NodeStats): number {
        let totalProgress = 0;
        let totalConnections = node.connections.size;
        
        if (totalConnections === 0) return 0;

        node.connections.forEach(conn => {
            totalProgress += (conn as any).uploadProgress || 0;
        });

        return totalProgress / totalConnections;
    }

    public async getNodeConnections(nodeId: string): Promise<AuthenticatedWebSocket[]> {
        const node = this.nodes.get(nodeId);
        return node ? Array.from(node.connections.values()) : [];
    }

    public async getHealthyNodes(): Promise<string[]> {
        return Array.from(this.nodes.entries())
            .filter(([_, stats]) => stats.status === 'active')
            .map(([nodeId]) => nodeId);
    }

    public async moveConnection(
        connection: AuthenticatedWebSocket,
        fromNodeId: string,
        toNodeId: string
    ): Promise<void> {
        const fromNode = this.nodes.get(fromNodeId);
        const toNode = this.nodes.get(toNodeId);

        if (!fromNode || !toNode) {
            throw new Error('Invalid node IDs for migration');
        }

        // Check if target node can accept the connection based on subscription
        const canAcceptConnection = this.isPreferredNode(
            toNodeId, 
            connection.subscriptionType as SubscriptionType
        );

        if (!canAcceptConnection) {
            throw new Error('Target node cannot accept connection type');
        }

        const connId = connection.userId;
        fromNode.connections.delete(connId);
        toNode.connections.set(connId, connection);

        // Update metrics
        this.updateNodeMetrics(fromNodeId);
        this.updateNodeMetrics(toNodeId);

        this.emit('connection:moved', {
            connectionId: connId,
            fromNode: fromNodeId,
            toNode: toNodeId,
            subscriptionType: connection.subscriptionType
        });
    }

    public async drainNode(nodeId: string): Promise<void> {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        node.status = 'draining';
        this.emit('node:draining', { nodeId, connectionsCount: node.connections.size });
    }

    private updateNodeMetrics(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Count connections by subscription type
        const connectionsByType = new Map<SubscriptionType, number>();
        node.connections.forEach(conn => {
            const subType = conn.subscriptionType as SubscriptionType;
            connectionsByType.set(subType, (connectionsByType.get(subType) || 0) + 1);
        });

        // Calculate weighted load based on subscription types
        let weightedLoad = 0;
        connectionsByType.forEach((count, type) => {
            const weight = this.getSubscriptionWeight(type);
            weightedLoad += (count * weight);
        });

        // Update node metrics
        node.metrics.load = weightedLoad / this.config.maxConnectionsPerNode;
        
        // Emit warning if node is approaching capacity
        if (node.metrics.load > 0.8) {
            this.emit('node:highLoad', {
                nodeId,
                load: node.metrics.load,
                connectionsByType: Object.fromEntries(connectionsByType)
            });
        }
    }

    // ALEEEERRRRRTTTT be careful with this one changed here in this particular block of code is impacted by
    private getSubscriptionWeight(type: SubscriptionType): number {
        switch (type) {
            case SubscriptionType.UNLOCKED:
                return 2.0;  // Higher priority users count more
            case SubscriptionType.PAID:
                return 1.5;
            default:
                return 1.0;
        }
    }

    private async evaluateScaling(): Promise<'up' | 'down' | null> {
        const currentMetrics = await this.getClusterMetrics();
        const timeWindow = this.getCurrentTimeWindow();
        
        // Calculate dimensionless ratios
        const loadRatio = this.calculateLoadRatio(currentMetrics);
        const pattern = this.updateLoadPattern(loadRatio, timeWindow.weight);

        // Make scaling decision based on patterns, not absolute numbers
        if (pattern.ratio > 0.8 && pattern.trend > 0.1) {
            return this.canScaleUp() ? 'up' : null;
        }

        if (pattern.ratio < 0.3 && pattern.trend < 0) {
            return this.canScaleDown() ? 'down' : null;
        }

        return null;
    }

    private calculateLoadRatio(metrics: any): number {
        const totalCapacity = this.nodes.size * this.config.maxConnectionsPerNode;
        const weightedLoad = Array.from(this.nodes.values()).reduce((sum, node) => {
            const subscriptionWeights = this.calculateNodeSubscriptionWeights(node);
            return sum + (node.metrics.load * subscriptionWeights);
        }, 0);

        return weightedLoad / totalCapacity;
    }

    private calculateNodeSubscriptionWeights(node: NodeStats): number {
        let weight = 0;
        node.connections.forEach(conn => {
            switch (conn.subscriptionType) {
                case SubscriptionType.UNLOCKED:
                    weight += 2.0;
                    break;
                case SubscriptionType.PAID:
                    weight += 1.5;
                    break;
                default:
                    weight += 1.0;
            }
        });
        return weight / Math.max(1, node.connections.size);
    }

    private updateLoadPattern(currentRatio: number, timeWeight: number): LoadPattern {
        const now = new Date();
        const hour = now.getHours();
        const key = `pattern_${hour}`;
        
        const existingPattern = this.scalingState.patterns.get(key) || {
            ratio: currentRatio,
            trend: 0,
            timeWeight
        };

        // Calculate trend as rate of change
        const trend = (currentRatio - existingPattern.ratio) / timeWeight;
        
        const updatedPattern = {
            ratio: currentRatio,
            trend: (trend + existingPattern.trend) / 2, // Smooth the trend
            timeWeight
        };

        this.scalingState.patterns.set(key, updatedPattern);
        return updatedPattern;
    }

    private getCurrentTimeWindow() {
        const hour = new Date().getHours();
        return this.timeWindows.find(w => w.hours.includes(hour)) || 
            { name: 'normal', weight: 1.0 };
    }

    private canScaleUp(): boolean {
        if (this.scalingState.cooldown) return false;
        
        const healthyNodes = Array.from(this.nodes.values())
            .filter(n => n.status === 'active');
        
        // Use ratios instead of absolute numbers
        const utilizationRatio = healthyNodes.reduce(
            (sum, node) => sum + node.metrics.load, 0
        ) / healthyNodes.length;

        return utilizationRatio > 0.7;
    }

    private canScaleDown(): boolean {
        if (this.scalingState.cooldown) return false;
        
        const healthyNodes = Array.from(this.nodes.values())
            .filter(n => n.status === 'active');
        
        if (healthyNodes.length <= 2) return false; // Minimum nodes

        const utilizationRatio = healthyNodes.reduce(
            (sum, node) => sum + node.metrics.load, 0
        ) / healthyNodes.length;

        return utilizationRatio < 0.3;
    }

    private async scaleCluster(direction: 'up' | 'down'): Promise<void> {
        const timestamp = new Date();
        
        // Emit scaling event with dimensionless metrics
        this.emit('scaling', {
            direction,
            patterns: Object.fromEntries(this.scalingState.patterns),
            timeWindow: this.getCurrentTimeWindow().name,
            utilizationRatio: this.calculateLoadRatio(await this.getClusterMetrics()),
            timestamp
        });

        // Set cooldown
        this.scalingState.cooldown = true;
        setTimeout(() => {
            this.scalingState.cooldown = false;
        }, 5 * 60 * 1000); // 5 minute cooldown

        // Record scaling action
        this.scalingState.lastScaling = timestamp;
    }

    private async checkScaling(): Promise<void> {
        // Don't check if in cooldown
        if (new Date() < this.nodeScalingState.cooldownUntil) {
            return;
        }

        const clusterMetrics = await this.getClusterMetrics();
        const needsScaling = this.evaluateScalingNeed(clusterMetrics);

        if (needsScaling === 'up') {
            await this.scaleUp(clusterMetrics);
        } else if (needsScaling === 'down') {
            await this.scaleDown(clusterMetrics);
        }
    }

    private async getClusterMetrics() {
        const metrics = {
            totalNodes: this.nodes.size,
            activeNodes: 0,
            avgCpu: 0,
            avgMemory: 0,
            totalConnections: 0,
            connectionCapacity: this.config.maxConnectionsPerNode * this.nodes.size,
            highPriorityLoad: 0
        };

        for (const node of this.nodes.values()) {
            if (node.status === 'active') {
                metrics.activeNodes++;
                metrics.avgCpu += node.metrics.cpu;
                metrics.avgMemory += node.metrics.memory;
                metrics.totalConnections += node.connections.size;
                metrics.highPriorityLoad += node.connections.size;
            }
        }

        metrics.avgCpu /= metrics.activeNodes;
        metrics.avgMemory /= metrics.activeNodes;
        
        return metrics;
    }

    private evaluateScalingNeed(metrics: any): 'up' | 'down' | null {
        if (metrics.totalConnections > metrics.connectionCapacity * 0.8) {
            return 'up';
        }

        if (metrics.totalConnections < metrics.connectionCapacity * 0.3) {
            return 'down';
        }

        return null;
    }   

    private async scaleUp(metrics: any): Promise<void> {
        const nodesToAdd = Math.min(
            this.scalingConfig.scaleUpBy,
            this.nodes.size - metrics.activeNodes
        );

        if (nodesToAdd === 0) return;

        const newNodes = await this.provisionNodes(nodesToAdd);
        this.nodes = new Map([...this.nodes, ...newNodes]);
        this.nodeScalingState.lastScalingAction = new Date();
        this.nodeScalingState.cooldownUntil = new Date(
            new Date().getTime() + this.scalingConfig.cooldownPeriod
        );
    }

    private async scaleDown(metrics: any): Promise<void> {
        const nodesToRemove = Math.min(
            this.scalingConfig.scaleDownBy,
            metrics.activeNodes - 1 // Keep at least one node
        );

        if (nodesToRemove === 0) return;

        const nodes = Array.from(this.nodes.values())
            .filter(n => n.status === 'active')
            .sort((a, b) => a.metrics.load - b.metrics.load);

        const nodesToDeactivate = nodes.slice(0, nodesToRemove);
        nodesToDeactivate.forEach(node => {
            node.status = 'draining';
        });

        this.nodeScalingState.lastScalingAction = new Date();
        this.nodeScalingState.cooldownUntil = new Date(
            new Date().getTime() + this.scalingConfig.cooldownPeriod
        );
    }

    private async provisionNodes(count: number): Promise<Map<string, NodeStats>> {
        const newNodes = new Map<string, NodeStats>();
        for (let i = 0; i < count; i++) {
            const nodeId = `node-${this.nodes.size + i + 1}`;
            newNodes.set(nodeId, {
                id: nodeId,
                connections: new Map(),
                metrics: {
                    cpu: 0,
                    memory: 0,
                    latency: 0,
                    errors: 0,
                    load: 0
                },
                status: 'active',
                lastHealthCheck: new Date()
            });
        }
        return newNodes;
    }
}


