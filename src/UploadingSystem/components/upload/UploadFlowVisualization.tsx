import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { metricsSubscription } from '@/MonitoringSystem/services/MetricsSubscriptionService';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { FLOW_STEPS, STATUS_STEP_MAPPING, VISUALIZATION_CONFIG } from '../../constants/uploadVisualization';
import { formatBytes, formatTime } from '../../utils/upload';
import { FlowStep } from './FlowStep';
import { UploadHeader } from './UploadHeader';
import { ProgressIndicator } from './ProgressIndicator';
import { SimulationButton } from './SimulationButton';
import type { SocketIOProgress } from '../../types/progress';
import type { VisualizationStep } from '../../constants/uploadVisualization';
import { UploadStatus, UPLOAD_STATUS } from '../../constants/uploadConstants';
import type { UploadMetrics } from '../../types/chunking';

interface UploadFlowVisualizationProps {
    trackingId: string;
    onProgress: (progress: SocketIOProgress) => void;
}

const initialProgress: SocketIOProgress = {
    userId: '',
    tenantId: '',
    trackingId: '',
    progress: 0,
    chunksCompleted: 0,
    totalChunks: 0,
    timestamp: Date.now(),
    estimatedTimeRemaining: 0,
    uploadSpeed: 0,
    serverLoad: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    status: UPLOAD_STATUS.INITIALIZING
};

const initialMetrics: UploadMetrics = {
    timestamp: Date.now(),
    value: 0,
    metadata: {
        component: 'upload_system',
        category: 'file_processing',
        aggregationType: 'latest',
        uploadStats: {
            activeUploads: 0,
            queueSize: 0,
            memoryUsage: 0,
            chunkProgress: 0
        }
    },
    type: "SYSTEM_HEALTH"
};

const calculateMetrics = (data: {
    uploadedBytes: number;
    totalBytes: number;
    chunksCompleted: number;
    totalChunks: number;
}): NonNullable<UploadMetrics['metadata']['uploadStats']> => ({
    activeUploads: 1,
    queueSize: data.totalChunks - data.chunksCompleted,
    memoryUsage: data.totalBytes > 0 ? (data.uploadedBytes / data.totalBytes) * 100 : 0,
    chunkProgress: data.totalChunks > 0 ? (data.chunksCompleted / data.totalChunks) * 100 : 0
});

const UploadFlowVisualization: React.FC<UploadFlowVisualizationProps> = ({
    trackingId,
    onProgress
}) => {
    const [progress, setProgress] = useState<SocketIOProgress>(initialProgress);
    const [activeSteps, setActiveSteps] = useState<Set<VisualizationStep>>(new Set());
    const [metrics, setMetrics] = useState<UploadMetrics>(initialMetrics);

    const updateActiveSteps = useCallback((status: UploadStatus) => {
        const steps = STATUS_STEP_MAPPING[status] || [];
        setActiveSteps(new Set(steps));
    }, []);

    const recordMetric = useCallback((data: SocketIOProgress) => {
        if (!data.trackingId) return;

        const uploadStats = calculateMetrics({
            uploadedBytes: data.uploadedBytes,
            totalBytes: data.totalBytes,
            chunksCompleted: data.chunksCompleted,
            totalChunks: data.totalChunks
        });

        // Record performance metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.PERFORMANCE,
            'upload_progress',
            'chunk_completion',
            data.chunksCompleted,
            MetricType.GAUGE,
            MetricUnit.COUNT,
            {
                trackingId: data.trackingId,
                totalChunks: data.totalChunks,
                uploadSpeed: data.uploadSpeed,
                status: data.status,
                isDashboardMetric: true,
                uploadStats
            }
        );

        // Record system health metrics
        monitoringManager.recordDashboardMetric({
            type: 'SYSTEM_HEALTH',
            timestamp: Date.now(),
            value: data.progress,
            metadata: {
                component: 'upload_system',
                category: 'file_processing',
                aggregationType: 'latest',
                uploadStats
            }
        });
    }, []);

    useEffect(() => {
        if (!trackingId) return;

        let isSubscribed = true;

        const unsubscribe = metricsSubscription.subscribe(
            trackingId,
            'upload_system',
            (metric) => {
                if (!isSubscribed || !metric.metadata?.uploadStats) return;

                const stats = metric.metadata.uploadStats;
                const normalizedStats = {
                    chunkProgress: stats.chunkProgress ?? 0,
                    chunksCompleted: stats.chunksCompleted ?? 0,
                    totalChunks: stats.totalChunks ?? 0,
                    uploadSpeed: stats.uploadSpeed ?? 0,
                    uploadedBytes: stats.uploadedBytes ?? 0,
                    totalBytes: stats.totalBytes ?? 0
                };

                const newProgress: SocketIOProgress = {
                    ...progress,
                    progress: normalizedStats.chunkProgress,
                    ...normalizedStats,
                    status: metric.metadata.status || progress.status,
                    timestamp: metric.timestamp
                };

                setProgress(newProgress);
                updateActiveSteps(newProgress.status);
                onProgress(newProgress);
                recordMetric(newProgress);

                const uploadStats = calculateMetrics(normalizedStats);
                
                setMetrics(prev => ({
                    ...prev,
                    timestamp: metric.timestamp,
                    value: metric.value,
                    metadata: {
                        ...prev.metadata,
                        uploadStats
                    }
                }));
            }
        );

        return () => {
            isSubscribed = false;
            unsubscribe();
        };
    }, [trackingId, onProgress, updateActiveSteps, recordMetric, progress]);

    const getChunkingSubSteps = useCallback((): string[] => [
        `${progress.chunksCompleted} of ${progress.totalChunks} chunks completed`,
        `${formatBytes(progress.uploadedBytes)} uploaded`,
        `Est. ${formatTime(progress.estimatedTimeRemaining)} remaining`
    ], [progress]);

    const renderFlowStep = useCallback((step: typeof FLOW_STEPS[VisualizationStep]) => (
        <Box
            key={step.id}
            className={step.id === VISUALIZATION_CONFIG.steps.CHUNKING.id ? 'ml-8' : ''}
        >
            <FlowStep
                {...step}
                isActive={activeSteps.has(step.id)}
                metrics={step.id === VISUALIZATION_CONFIG.steps.CHUNKING.id ? metrics : undefined}
                subSteps={
                    step.id === VISUALIZATION_CONFIG.steps.CHUNKING.id
                        ? getChunkingSubSteps()
                        : step.subSteps
                }
            />
        </Box>
    ), [activeSteps, metrics, getChunkingSubSteps]);

    const simulateProgress = () => {
        const trackingId = initialProgress.trackingId;
        simulateProgressData.forEach((mockProgress, index) => {
            setTimeout(() => {
                const newProgress: SocketIOProgress = {
                    ...initialProgress,
                    trackingId,
                    ...mockProgress,
                    timestamp: Date.now()
                };
                setProgress(newProgress);
                updateActiveSteps(newProgress.status);
                onProgress(newProgress);
                recordMetric(newProgress);
            }, index * 1000);
        });
    };

    if (!trackingId) {
        return null;
    }

    return (
        <Box className="p-6 max-w-4xl mx-auto">
            <Paper elevation={3} className="p-6">
                <UploadHeader
                    status={progress.status}
                    uploadSpeed={progress.uploadSpeed} progress={0} estimatedTimeRemaining={0}                />
                <ProgressIndicator
                    progress={progress.progress}
                    chunksCompleted={progress.chunksCompleted}
                    totalChunks={progress.totalChunks}
                />
                <Box className="space-y-4">
                    {VISUALIZATION_CONFIG.order.map(step => renderFlowStep(FLOW_STEPS[step]))}
                </Box>
                <SimulationButton onClick={simulateProgress} />
            </Paper>
        </Box>
    );
};

const simulateProgressData = [
    {
        status: UPLOAD_STATUS.INITIALIZING,
        progress: 0,
        chunksCompleted: 0,
        totalChunks: 10,
        uploadedBytes: 0,
        totalBytes: 10000000,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0
    },
    {
        status: UPLOAD_STATUS.UPLOADING,
        progress: 50,
        chunksCompleted: 5,
        totalChunks: 10,
        uploadedBytes: 5000000,
        totalBytes: 10000000,
        uploadSpeed: 1000000,
        estimatedTimeRemaining: 5000
    },
    {
        status: UPLOAD_STATUS.PROCESSING,
        progress: 100,
        chunksCompleted: 10,
        totalChunks: 10,
        uploadedBytes: 10000000,
        totalBytes: 10000000,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0
    },
    {
        status: UPLOAD_STATUS.PAUSED,
        progress: 25,
        chunksCompleted: 2.5,
        totalChunks: 10,
        uploadedBytes: 2500000,
        totalBytes: 10000000,
        uploadSpeed: 0,
        estimatedTimeRemaining: 10000
    },
    {
        status: UPLOAD_STATUS.RESUMING,
        progress: 25,
        chunksCompleted: 2.5,
        totalChunks: 10,
        uploadedBytes: 2500000,
        totalBytes: 10000000,
        uploadSpeed: 500000,
        estimatedTimeRemaining: 15000
    },
    {
        status: UPLOAD_STATUS.COMPLETED,
        progress: 100,
        chunksCompleted: 10,
        totalChunks: 10,
        uploadedBytes: 10000000,
        totalBytes: 10000000,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0
    },
    {
        status: UPLOAD_STATUS.CANCELLED,
        progress: 0,
        chunksCompleted: 0,
        totalChunks: 10,
        uploadedBytes: 0,
        totalBytes: 10000000,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0
    },
    {
        status: UPLOAD_STATUS.FAILED,
        progress: 75,
        chunksCompleted: 7.5,
        totalChunks: 10,
        uploadedBytes: 7500000,
        totalBytes: 10000000,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0
    }
];

export default UploadFlowVisualization;
