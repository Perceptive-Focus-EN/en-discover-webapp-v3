// src/tests/GlobalStressTest.ts
import path from 'path';
import { register } from 'ts-node';
import { ErrorType, SystemError } from '@/MonitoringSystem/constants/errors';
import { SocketManager } from '../UploadingSystem/managers/SocketManager';
import { ChunkingService } from '../UploadingSystem/services/ChunkingService';
import { SubscriptionType } from '../UploadingSystem/services/SubscriptionService';
import { BlockBlobClient } from '@azure/storage-blob';
import fs from 'fs';
import colors from 'colors/safe';

// Register ts-node
register({
    project: path.join(process.cwd(), 'tsconfig.json'),
    transpileOnly: true,
    compilerOptions: { module: 'commonjs' }
});

// Mock Logger
class MockLogger {
    private logs: any[] = [];

    error(error: Error, type: string, metadata?: any) {
        this.logs.push({
            level: 'ERROR',
            message: error.message,
            type,
            metadata,
            timestamp: new Date()
        });
        console.log(colors.red(`[ERROR] ${error.message}`), { type, metadata });
    }

    warn(message: string, metadata?: any) {
        this.logs.push({
            level: 'WARN',
            message,
            metadata,
            timestamp: new Date()
        });
        console.log(colors.yellow(`[WARN] ${message}`), metadata);
    }

    info(message: string, metadata?: any) {
        this.logs.push({
            level: 'INFO',
            message,
            metadata,
            timestamp: new Date()
        });
        console.log(colors.blue(`[INFO] ${message}`), metadata);
    }

    getLogs() {
        return this.logs;
    }
}

// Mock Monitoring Manager
class MockMonitoringManager {
    public readonly logger: MockLogger;
    private metrics: any[] = [];

    constructor() {
        this.logger = new MockLogger();
    }

    recordDashboardMetric(metric: any) {
        this.metrics.push({
            ...metric,
            timestamp: new Date()
        });
        console.log(colors.cyan('[Metric]'), metric);
    }

    getMetrics() {
        return this.metrics;
    }
}

const mockMonitoringManager = new MockMonitoringManager();

interface RegionConfig {
    name: string;
    userLoad: number;
    peakHours: number[];
    latency: number;
    subscriptionDistribution: {
        [key in SubscriptionType]?: number;
    };
    uploadPatterns: {
        averageFileSize: number;
        burstProbability: number;
        concurrentUploads: number;
    };
}

const GLOBAL_REGIONS: RegionConfig[] = [
    {
        name: 'East Asia',
        userLoad: 25_000_000,
        peakHours: [1, 2, 3, 4, 5, 6, 7, 8],
        latency: 100,
        subscriptionDistribution: {
            [SubscriptionType.UNLOCKED]: 0.05,
            [SubscriptionType.PAID]: 0.15,
            [SubscriptionType.DISCOUNTED]: 0.30,
            [SubscriptionType.TRIAL]: 0.50
        },
        uploadPatterns: {
            averageFileSize: 50 * 1024 * 1024,
            burstProbability: 0.3,
            concurrentUploads: 1_000_000
        }
    },
    {
        name: 'Europe',
        userLoad: 20_000_000,
        peakHours: [8, 9, 10, 11, 12, 13, 14, 15],
        latency: 50,
        subscriptionDistribution: {
            [SubscriptionType.UNLOCKED]: 0.10,
            [SubscriptionType.PAID]: 0.25,
            [SubscriptionType.DISCOUNTED]: 0.35,
            [SubscriptionType.TRIAL]: 0.30
        },
        uploadPatterns: {
            averageFileSize: 75 * 1024 * 1024,
            burstProbability: 0.25,
            concurrentUploads: 800_000
        }
    },
    {
        name: 'North America',
        userLoad: 30_000_000,
        peakHours: [16, 17, 18, 19, 20, 21, 22, 23],
        latency: 75,
        subscriptionDistribution: {
            [SubscriptionType.UNLOCKED]: 0.20,
            [SubscriptionType.PAID]: 0.20,
            [SubscriptionType.DISCOUNTED]: 0.30,
            [SubscriptionType.TRIAL]: 0.30
        },
        uploadPatterns: {
            averageFileSize: 100 * 1024 * 1024,
            burstProbability: 0.35,
            concurrentUploads: 1_200_000
        }
    }
];

export class GlobalStressTest {

    private async startRegionalSimulation(region: RegionConfig) {
        console.log(colors.green(`Starting simulation for region: ${region.name}`));
        // Add your simulation logic here
    }
    private socketManager = SocketManager.getInstance();
    private chunkingService = ChunkingService.getInstance();
    private activeSimulations = new Map<string, NodeJS.Timer>();
    private startTime: number;

    private metrics = {
        totalRequests: 0,
        failedRequests: 0,
        peakConcurrent: 0,
        avgLatency: 0,
        regionalStats: new Map<string, {
            success: number;
            failed: number;
            avgLatency: number;
            activeUsers: number;
            peakLoad: number;
            ddosAttempts: number;
        }>()
    };

    constructor() {
        this.startTime = Date.now();
    }

    async runGlobalSimulation() {
        console.log(colors.green('\nStarting Global Stress Test...'));
        
        // Initialize metrics for each region
        GLOBAL_REGIONS.forEach(region => {
            this.metrics.regionalStats.set(region.name, {
                success: 0,
                failed: 0,
                avgLatency: 0,
                activeUsers: 0,
                peakLoad: 0,
                ddosAttempts: 0
            });
        });

        // Start all simulations
        await Promise.all([
            ...GLOBAL_REGIONS.map(region => this.startRegionalSimulation(region)),
            this.startAggressiveDDOSAttack(),
            this.monitorGlobalMetrics(),
            this.simulateLoadSpikes(),
            this.persistMetrics()
        ]);
    }

    private async startAggressiveDDOSAttack() {
        const ddosPatterns = [
            {
                type: 'CONNECTION_FLOOD',
                requestsPerBatch: 10000,
                duration: 300000,
                intensity: 0.8
            },
            {
                type: 'RESOURCE_EXHAUSTION',
                largeFiles: true,
                concurrentUploads: 5000,
                duration: 600000,
                intensity: 0.9
            }
        ];

        ddosPatterns.forEach(pattern => {
            setInterval(() => {
                const targetRegion = GLOBAL_REGIONS[
                    Math.floor(Math.random() * GLOBAL_REGIONS.length)
                ];
                this.simulateAttackPattern(targetRegion.name, pattern);
            }, pattern.duration / 10); // More frequent attacks
        });
    }

    private async simulateLoadSpikes() {
        setInterval(() => {
            const region = GLOBAL_REGIONS[Math.floor(Math.random() * GLOBAL_REGIONS.length)];
            const spikeLoad = region.userLoad * (1 + Math.random());
            
            mockMonitoringManager.logger.warn(`Load spike detected in ${region.name}`, {
                normalLoad: region.userLoad,
                spikeLoad,
                timestamp: new Date()
            });

            this.simulateConcurrentUploads(region, spikeLoad);
        }, 120000); // Every 2 minutes
    }

    private async simulateAttackPattern(region: string, pattern: any) {
        const stats = this.metrics.regionalStats.get(region);
        if (!stats) return;

        stats.ddosAttempts++;
        const batchSize = Math.floor(pattern.requestsPerBatch * pattern.intensity);

        const promises = Array.from({ length: batchSize }, () =>
            this.simulateRequest(region, pattern.type, true)
        );

        try {
            await Promise.all(promises);
        } catch (error) {
            mockMonitoringManager.logger.error(
                error as Error,
                'DDOS_ATTEMPT_BLOCKED',
                { region, pattern }
            );
        }
    }

    private async simulateRequest(region: string, type: string, isDDOS: boolean = false) {
        const stats = this.metrics.regionalStats.get(region);
        if (!stats) return;

        this.metrics.totalRequests++;
        stats.activeUsers++;

        try {
            const latency = this.simulateLatency(region, isDDOS);
            stats.avgLatency = (stats.avgLatency + latency) / 2;

            if (Math.random() > (isDDOS ? 0.9 : 0.2)) { // DDOS requests more likely to fail
                stats.success++;
                this.metrics.peakConcurrent = Math.max(
                    this.metrics.peakConcurrent,
                    stats.activeUsers
                );
            } else {
                throw new Error('Request failed');
            }
        } catch (error) {
            stats.failed++;
            this.metrics.failedRequests++;
            mockMonitoringManager.logger.error(
                error as Error,
                isDDOS ? 'DDOS_ATTEMPT' : 'REQUEST_FAILED',
                { region, type }
            );
        } finally {
            stats.activeUsers--;
            stats.peakLoad = Math.max(stats.peakLoad, stats.activeUsers);
        }
    }

    private simulateLatency(region: string, isDDOS: boolean): number {
        const baseLatency = GLOBAL_REGIONS.find(r => r.name === region)?.latency || 100;
        const jitter = Math.random() * 50;
        const ddosImpact = isDDOS ? Math.random() * 1000 : 0;
        return baseLatency + jitter + ddosImpact;
    }

    private async simulateConcurrentUploads(region: RegionConfig, userCount: number) {
        const batchSize = 1000;
        const batches = Math.ceil(userCount / batchSize);

        for (let i = 0; i < batches; i++) {
            const currentBatchSize = Math.min(batchSize, userCount - i * batchSize);
            const promises = Array.from({ length: currentBatchSize }, () =>
                this.simulateRequest(region.name, 'NORMAL_UPLOAD')
            );

            await Promise.all(promises);
        }
    }

    private monitorGlobalMetrics() {
        return setInterval(() => {
            console.clear();
            console.log(colors.cyan('\n=== Global Stress Test Metrics ==='));
            console.log(colors.yellow(`Duration: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`));

            console.log(colors.green('\nGlobal Statistics:'));
            console.log(`Total Requests: ${this.metrics.totalRequests.toLocaleString()}`);
            console.log(`Failed Requests: ${this.metrics.failedRequests.toLocaleString()}`);
            console.log(`Success Rate: ${(
                ((this.metrics.totalRequests - this.metrics.failedRequests) / 
                Math.max(this.metrics.totalRequests, 1)) * 100
            ).toFixed(2)}%`);
            console.log(`Peak Concurrent Users: ${this.metrics.peakConcurrent.toLocaleString()}`);

            console.log(colors.green('\nRegional Statistics:'));
            this.metrics.regionalStats.forEach((stats, region) => {
                console.log(colors.yellow(`\n${region}:`));
                console.log(`  Active Users: ${stats.activeUsers.toLocaleString()}`);
                console.log(`  Success Rate: ${(
                    (stats.success / Math.max(stats.success + stats.failed, 1)) * 100
                ).toFixed(2)}%`);
                console.log(`  Avg Latency: ${stats.avgLatency.toFixed(2)}ms`);
                console.log(`  Peak Load: ${stats.peakLoad.toLocaleString()}`);
                console.log(`  DDOS Attempts: ${stats.ddosAttempts.toLocaleString()}`);
            });

        }, 1000);
    }

    private async persistMetrics() {
        const metricsDir = path.join(process.cwd(), 'stress-test-results');
        if (!fs.existsSync(metricsDir)) {
            fs.mkdirSync(metricsDir);
        }

        setInterval(() => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filePath = path.join(metricsDir, `metrics-${timestamp}.json`);

            const metricsData = {
                timestamp: new Date().toISOString(),
                duration: Date.now() - this.startTime,
                globalStats: {
                    totalRequests: this.metrics.totalRequests,
                    failedRequests: this.metrics.failedRequests,
                    successRate: (
                        ((this.metrics.totalRequests - this.metrics.failedRequests) / 
                        Math.max(this.metrics.totalRequests, 1)) * 100
                    ).toFixed(2) + '%',
                    peakConcurrent: this.metrics.peakConcurrent
                },
                regionalStats: Object.fromEntries(this.metrics.regionalStats),
                logs: mockMonitoringManager.logger.getLogs(),
                systemMetrics: mockMonitoringManager.getMetrics()
            };

            fs.writeFileSync(filePath, JSON.stringify(metricsData, null, 2));
        }, 60000); // Every minute
    }

    public stopSimulation() {
        console.log(colors.yellow('\nStopping simulation...'));
        
        for (const [region, interval] of this.activeSimulations) {
            clearInterval(interval as NodeJS.Timeout);
        }
        this.activeSimulations.clear();

        const finalMetrics = {
            duration: (Date.now() - this.startTime) / 1000,
            totalRequests: this.metrics.totalRequests,
            failedRequests: this.metrics.failedRequests,
            successRate: (
                ((this.metrics.totalRequests - this.metrics.failedRequests) / 
                Math.max(this.metrics.totalRequests, 1)) * 100
            ).toFixed(2) + '%',
            peakConcurrent: this.metrics.peakConcurrent,
            regionalStats: Object.fromEntries(this.metrics.regionalStats)
        };

        console.log(colors.green('\nFinal Simulation Metrics:'));
        console.log(JSON.stringify(finalMetrics, null, 2));

        // Save final results
        const finalPath = path.join(
            process.cwd(),
            'stress-test-results',
            `final-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
        );
        fs.writeFileSync(finalPath, JSON.stringify(finalMetrics, null, 2));
    }
}

// Usage
if (require.main === module) {
    const stressTest = new GlobalStressTest();
    stressTest.runGlobalSimulation().catch(error => {
        console.error(colors.red('Stress test failed:'), error);
        stressTest.stopSimulation();
        process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(colors.yellow('\nReceived SIGINT. Gracefully shutting down...'));
        stressTest.stopSimulation();
        process.exit(0);
    });
}
