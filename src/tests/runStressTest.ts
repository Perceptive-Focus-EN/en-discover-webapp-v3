import path from 'path';
import { GlobalStressTest } from './GlobalStressTest';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import colors from 'colors';
import { ErrorType } from '@/MonitoringSystem/constants/errors';
import geoip from 'geoip-lite';
import fs from 'fs';

interface StressTestMetrics {
    totalRequests: number;
    failedRequests: number;
    successRate: string;
    peakConcurrent: number;
    regionalStats: Map<string, {
        activeUsers: number;
        success: number;
        failed: number;
        avgLatency: number;
    }>;
}

interface StressTest {
    metrics: StressTestMetrics;
    runGlobalSimulation: () => Promise<void>;
    stopSimulation: () => Promise<void>;
}

const GLOBAL_REGIONS = [
    { name: 'us-west', userLoad: 1000 },
    { name: 'us-central', userLoad: 2000 },
    { name: 'us-east', userLoad: 3000 },
    { name: 'eu-west', userLoad: 1500 },
    { name: 'ap-southeast', userLoad: 500 }
];

function getRegionByIP(ip: string) {
    const geo = geoip.lookup(ip);
    if (geo) {
        return geo.region;
    }
    return 'unknown';
}

async function runTest() {
    console.log(colors.green('Initializing Global Stress Test...'));
    const startTime = Date.now();
    const stressTest: StressTest = new GlobalStressTest() as unknown as StressTest;

    const metricsInterval = displayMetrics(stressTest, startTime);

    process.on('SIGINT', async () => {
        console.log(colors.red('\nReceived SIGINT. Gracefully shutting down...'));
        clearInterval(metricsInterval);
        await stressTest.stopSimulation();
        process.exit(0);
    });

    try {
        console.log(colors.green('Starting simulation...'));
        await stressTest.runGlobalSimulation();

        const testDuration = 3600000; // 1 hour
        setTimeout(async () => {
            console.log(colors.red('Test duration completed. Shutting down...'));
            clearInterval(metricsInterval);
            await stressTest.stopSimulation();
            process.exit(0);
        }, testDuration);

    } catch (error) {
        console.error(colors.red('Test failed:'), error);
        monitoringManager.logger.error(error, 'STRESS_TEST_FAILED' as ErrorType, {
            duration: Date.now() - startTime
        });
        clearInterval(metricsInterval);
        await stressTest.stopSimulation();
        process.exit(1);
    }
}

function displayMetrics(stressTest: StressTest, startTime: number) {
    return setInterval(() => {
        console.log(colors.cyan('\n=== Global Stress Test Metrics ==='));
        console.log('Time elapsed:', ((Date.now() - startTime) / 1000).toFixed(2), 'seconds');

        console.log(colors.yellow('\n=== Regional Status ==='));
        GLOBAL_REGIONS.forEach(region => {
            const stats = stressTest.metrics.regionalStats.get(region.name);
            if (stats) {
                console.log(colors.green(`\n${region.name}:`));
                console.log(`  Active Users: ${stats.activeUsers.toLocaleString()}`);
                console.log(`  Success Rate: ${((stats.success / (stats.success + stats.failed)) * 100).toFixed(2)}%`);
                console.log(`  Avg Latency: ${stats.avgLatency.toFixed(2)}ms`);
                console.log(`  Load: ${((stats.activeUsers / region.userLoad) * 100).toFixed(2)}%`);
            }
        });

        console.log(colors.yellow('\n=== System Health ==='));
        console.log(`Total Requests: ${stressTest.metrics.totalRequests.toLocaleString()}`);
        console.log(`Failed Requests: ${stressTest.metrics.failedRequests.toLocaleString()}`);
        console.log(`Success Rate: ${(((stressTest.metrics.totalRequests - stressTest.metrics.failedRequests) /
            Math.max(stressTest.metrics.totalRequests, 1)) * 100).toFixed(2)}%`);

        aggregateMetrics(stressTest.metrics);
        persistMetrics(stressTest.metrics);
    }, 1000);
}

function aggregateMetrics(metrics: StressTestMetrics) {
    // Implement your aggregation logic here
    // For example, you can aggregate metrics over a certain period
    console.log(colors.blue('Aggregating metrics...'));
}

function persistMetrics(metrics: StressTestMetrics) {
    // Implement your persistence logic here
    // For example, you can save metrics to a file or a database
    const metricsFilePath = path.join(__dirname, 'metrics.json');
    fs.writeFileSync(metricsFilePath, JSON.stringify(metrics, null, 2));
    console.log(colors.blue('Persisting metrics to file...'));
}

if (require.main === module) {
    runTest().catch(error => {
        console.error(colors.red('Test failed:'), error);
        process.exit(1);
    });
}

runTest().catch(console.error);
