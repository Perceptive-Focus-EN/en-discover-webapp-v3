// src/UploadingSystem/services/LoadBalancer.ts
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { AuthenticatedWebSocket } from '../middleware/socketAuthMiddleware';
import { EventEmitter } from 'events';

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

export class LoadBalancer extends EventEmitter {
    private static instance: LoadBalancer | null = null;
    private nodes: Map<string, NodeStats> = new Map();
    private readonly config: LoadBalancerConfig;

    private constructor(config: LoadBalancerConfig) {
        super();
        this.config = config;
        this.initializeNodes();
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

    public async getBestNode(): Promise<string | null> {
        const activeNodes = Array.from(this.nodes.entries())
            .filter(([_, stats]) => stats.status === 'active');

        if (activeNodes.length === 0) {
            return null;
        }

        if (this.config.failoverStrategy === 'round-robin') {
            return this.getRoundRobinNode(activeNodes);
        }

        const activeNodeIds = activeNodes.map(([nodeId]) => nodeId);
        return this.getLeastLoadedNode(activeNodeIds);
    }

    private getRoundRobinNode(activeNodes: [string, NodeStats][]): string {
        const node = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        return node[0];
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

        const connId = (connection as any).id || connection.userId;
        fromNode.connections.delete(connId);
        toNode.connections.set(connId, connection);

        // Update metrics
        this.updateNodeMetrics(fromNodeId);
        this.updateNodeMetrics(toNodeId);

        this.emit('connection:moved', {
            connectionId: connId,
            fromNode: fromNodeId,
            toNode: toNodeId
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

        const connectionLoad = node.connections.size / this.config.maxConnectionsPerNode;
        const errorRate = node.metrics.errors / Math.max(1, node.connections.size);

        node.metrics.load = (
            connectionLoad * 0.4 + 
            node.metrics.cpu * 0.3 + 
            node.metrics.memory * 0.3
        );

        if (errorRate > 0.05 || node.metrics.load > 0.9) {
            this.emit('node:overloaded', {
                nodeId,
                metrics: node.metrics,
                errorRate
            });
        }
    }
}

export const loadBalancer = LoadBalancer.getInstance({
    maxConnectionsPerNode: 100000,
    nodes: process.env.SOCKET_NODES?.split(',') || ['default-node'],
    failoverStrategy: 'least-connections'
});