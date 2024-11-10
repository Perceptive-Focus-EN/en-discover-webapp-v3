import { useEffect, useState, useCallback } from "react";
import { io, Socket } from 'socket.io-client';
import { 
    UploadStatus, 
    UPLOAD_STATUS,  
} from "../constants/uploadConstants";
import { SocketIOProgress } from "../types/progress";
import { 
    VisualizationStep, 
    STATUS_STEP_MAPPING,
} from "../constants/uploadVisualization";
import { UploadMetrics } from "../types/chunking";
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LogLevel } from '@/MonitoringSystem/constants/logging';

interface UseUploadVisualizationProps {
    trackingId: string;
    onProgress: (progress: SocketIOProgress) => void;
    socket?: Socket | null;
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

export const useUploadVisualization = ({
    trackingId,
    onProgress,
    socket: existingSocket
}: UseUploadVisualizationProps) => {
    const [socket, setSocket] = useState<Socket | null>(existingSocket || null);
    const [progress, setProgress] = useState<SocketIOProgress>(initialProgress);
    const [activeSteps, setActiveSteps] = useState<Set<VisualizationStep>>(new Set());
    const [metrics, setMetrics] = useState<UploadMetrics>(initialMetrics);

    const updateActiveSteps = useCallback((status: UploadStatus) => {
        const steps = STATUS_STEP_MAPPING[status] || [];
        setActiveSteps(new Set(steps));
    }, []);

    const recordMetric = useCallback((data: SocketIOProgress) => {
        // Record upload progress metrics
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
                isDashboardMetric: true
            }
        );

        // Record system health metrics
        monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'upload_system',
            'server_load',
            data.serverLoad,
            MetricType.GAUGE,
            MetricUnit.PERCENTAGE,
            {
                trackingId: data.trackingId,
                isDashboardMetric: true
            }
        );
    }, []);

    const updateProgress = useCallback((newProgress: SocketIOProgress) => {
        setProgress(newProgress);
        updateActiveSteps(newProgress.status);
        onProgress?.(newProgress);
        
        // Record metrics
        recordMetric(newProgress);

        // Update dashboard metrics
        monitoringManager.recordDashboardMetric({
            type: 'SYSTEM_HEALTH',
            timestamp: Date.now(),
            value: newProgress.progress,
            metadata: {
                component: 'upload_system',
                category: 'file_processing',
                aggregationType: 'latest',
                uploadStats: {
                    activeUploads: 1,
                    queueSize: newProgress.totalChunks - newProgress.chunksCompleted,
                    memoryUsage: (newProgress.uploadedBytes / newProgress.totalBytes) * 100,
                    chunkProgress: (newProgress.chunksCompleted / newProgress.totalChunks) * 100
                }
            }
        });

        // Log important status changes
        if (newProgress.status !== progress.status) {
            monitoringManager.logger.info(`Upload status changed to ${newProgress.status}`, {
                category: LogCategory.SYSTEM,
                trackingId: newProgress.trackingId,
                previousStatus: progress.status,
                newStatus: newProgress.status
            });
        }
    }, [onProgress, updateActiveSteps, progress.status, recordMetric]);

    const handleSimulateUpload = useCallback(() => {
        if (progress.status === UPLOAD_STATUS.UPLOADING) {
            // Reset
            const resetProgress: SocketIOProgress = {
                ...initialProgress,
                trackingId,
                timestamp: Date.now()
            };
            updateProgress(resetProgress);
            socket?.emit('reset', { trackingId });

            monitoringManager.logger.info('Upload reset', {
                category: LogCategory.SYSTEM,
                trackingId
            });
        } else {
            // Start Upload
            const startProgress: SocketIOProgress = {
                ...progress,
                status: UPLOAD_STATUS.UPLOADING,
                totalChunks: 100,
                totalBytes: 1024 * 1024 * 100, // 100MB simulation
                timestamp: Date.now()
            };
            updateProgress(startProgress);
            socket?.emit('start', { 
                trackingId,
                totalChunks: 100,
                totalBytes: 1024 * 1024 * 100
            });

            monitoringManager.logger.info('Upload started', {
                category: LogCategory.SYSTEM,
                trackingId,
                totalChunks: 100,
                totalBytes: 1024 * 1024 * 100
            });
        }
    }, [progress.status, trackingId, updateProgress, socket]);

    useEffect(() => {
        if (existingSocket) {
            setSocket(existingSocket);
            return;
        }

        const initSocket = async () => {
            if (!trackingId) return;
            
            try {
                // Initialize socket connection
                await fetch('/api/socketio');
                
                const socketIo = io(process.env.NEXT_PUBLIC_WS_URL!, {
                    path: '/api/socketio',
                    query: { trackingId },
                    transports: ['websocket', 'polling'],
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000
                });

                socketIo.on('connect', () => {
                    monitoringManager.logger.info('SocketIO connected', {
                        category: LogCategory.SYSTEM,
                        trackingId
                    });
                    
                    setProgress(prev => ({
                        ...initialProgress,
                        trackingId,
                        timestamp: Date.now()
                    }));
                });

                // Listen for progress updates
                socketIo.on('progress', (data: SocketIOProgress) => {
                    updateProgress(data);
                });

                socketIo.on('error', (error: Error) => {
                    const errorMetadata = {
                        trackingId,
                        socketId: socketIo.id,
                        error: error.message
                    };

                    monitoringManager.error.handleError(
                        monitoringManager.error.createError(
                            'system',
                            'SOCKETIO_ERROR',
                            error.message,
                            errorMetadata
                        )
                    );

                    setProgress(prev => ({
                        ...prev,
                        status: UPLOAD_STATUS.FAILED,
                        error: error.message
                    }));
                });

                socketIo.on('disconnect', () => {
                    monitoringManager.logger.warn('SocketIO disconnected', {
                        category: LogCategory.SYSTEM,
                        trackingId
                    });
                });

                socketIo.on('reconnect', (attemptNumber: number) => {
                    monitoringManager.logger.info(`SocketIO reconnected after ${attemptNumber} attempts`, {
                        category: LogCategory.SYSTEM,
                        trackingId,
                        attemptNumber
                    });
                });

                socketIo.on('metrics', (uploadMetrics: UploadMetrics) => {
                    setMetrics(uploadMetrics);
                    monitoringManager.recordDashboardMetric(uploadMetrics);
                });

                setSocket(socketIo);

                return () => {
                    socketIo.disconnect();
                };
            } catch (error) {
                monitoringManager.error.handleError(
                    monitoringManager.error.createError(
                        'system',
                        'SOCKETIO_INIT_FAILED',
                        'Failed to initialize SocketIO connection',
                        { trackingId, error }
                    )
                );
            }
        };

        if (!socket && !existingSocket) {
            initSocket();
        }

        return () => {
            if (!existingSocket && socket) {
                socket.disconnect();
                setSocket(null);
            }
        };
    }, [trackingId, existingSocket, updateProgress]);

    return {
        progress,
        activeSteps,
        metrics,
        updateProgress,
        handleSimulateUpload,
        socket,
        isConnected: socket?.connected ?? false
    } as const;
};

export type { VisualizationStep };
