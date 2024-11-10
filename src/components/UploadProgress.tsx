import { FC, useEffect, useState, useCallback } from 'react';
import { useUploadVisualization } from '../UploadingSystem/hooks/useUploadVisualization';
import { formatBytes } from '../utils/formatters';
import { UPLOAD_STATUS, UploadStatus } from '../UploadingSystem/constants/uploadConstants';
import { SocketIOProgress } from '@/UploadingSystem/types/progress';

    
interface UploadProgressProps {
    trackingId: string;
    userId: string;
    className?: string;
    onComplete?: (finalProgress?: SocketIOProgress) => void;
    onError?: (error: Error) => void;
    onPause?: () => Promise<void>;
    onResume?: () => Promise<void>;
    onRetry?: () => Promise<void>;
    onCancel?: () => Promise<void>;
}

export const UploadProgress: FC<UploadProgressProps> = ({ 
    trackingId, 
    className = '',
    onComplete,
    onError,
    onPause,
    onResume,
    onRetry,
    onCancel
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const { 
        progress, 
        activeSteps, 
        metrics, 
        updateProgress,
        isConnected
    } = useUploadVisualization({
        trackingId,
        onProgress: (newProgress) => {
            if (newProgress.status === UPLOAD_STATUS.COMPLETED) {
                onComplete?.(newProgress);
            }
        }
    });

    const handleAction = useCallback(async (action: () => Promise<void>) => {
        if (!action) return;
        setIsLoading(true);
        try {
            await action();
        } catch (error) {
            onError?.(error as Error);
        } finally {
            setIsLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        if (!isConnected && progress?.status === UPLOAD_STATUS.UPLOADING) {
            onError?.(new Error('Connection lost. Upload may be interrupted.'));
        }
    }, [isConnected, progress?.status, onError]);

    const getStatusColor = useCallback((status: UploadStatus) => {
        switch (status) {
            case UPLOAD_STATUS.COMPLETED:
                return 'text-green-600 bg-green-100 border border-green-200';
            case UPLOAD_STATUS.FAILED:
                return 'text-red-600 bg-red-50 border border-red-200';
            case UPLOAD_STATUS.PAUSED:
                return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
            case UPLOAD_STATUS.UPLOADING:
            case UPLOAD_STATUS.RESUMING:
                return 'text-blue-600 bg-blue-50 border border-blue-200';
            case UPLOAD_STATUS.CANCELLED:
                return 'text-gray-500 bg-gray-100 border border-gray-200';
            case UPLOAD_STATUS.INITIALIZING:
            default:
                return 'text-gray-600 bg-gray-50 border border-gray-200';
        }
    }, []);

    if (progress?.status === 'completed') {
        return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-green-700 font-medium">Upload completed successfully</p>
                    </div>
                    <span className="text-sm text-green-600">{formatBytes(progress.totalBytes)}</span>
                </div>
                <div className="mt-2 text-sm text-green-600">
                    <div className="flex justify-between items-center">
                        <span>Processed {progress.chunksCompleted} chunks</span>
                        <span className="px-2 py-1 bg-green-100 rounded-md">{progress.status}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (progress?.status === UPLOAD_STATUS.CANCELLED) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-700 font-medium">Upload was cancelled.</p>
            </div>
        );
    }

    if (progress?.error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">Error tracking upload: {progress.error}</p>
                {onRetry && (
                    <button
                        onClick={() => handleAction(onRetry)}
                        disabled={isLoading}
                        className="mt-2 px-3 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        {isLoading ? 'Retrying...' : 'Retry'}
                    </button>
                )}
            </div>
        );
    }

    if (!progress) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="animate-pulse space-y-3">
                    <div className="h-2 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-2 bg-gray-200 rounded-full w-1/2" />
                    <div className="h-2 bg-gray-200 rounded-full w-2/3" />
                    <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>Initializing upload...</span>
                        <div className="h-2 w-2 bg-gray-300 rounded-full animate-ping" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
            {/* Connection Status */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-500">
                        {isConnected ? 'Connected' : 'Reconnecting...'}
                    </span>
                </div>
                <span className="text-sm text-gray-500">
                    {formatBytes(metrics.metadata.uploadStats.activeUploads)} MB/s
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${Math.min((progress.uploadedBytes / progress.totalBytes) * 100, 100)}%` }}
                    />
                </div>
                <div className="mt-1 flex justify-between text-sm">
                    <span className="text-gray-600">
                        {Math.min(progress.progress, 100).toFixed(1)}%
                    </span>
                    <span className="text-gray-500">
                        {formatBytes(progress.uploadedBytes)}/{formatBytes(progress.totalBytes)}
                    </span>
                </div>
            </div>

            {/* Enhanced Metrics */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Upload Speed:</span>
                    <span className="font-medium">{formatBytes(metrics.metadata.uploadStats.activeUploads)} MB/s</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Server Load:</span>
                    <span className="font-medium">{metrics.metadata.uploadStats.memoryUsage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Queue Size:</span>
                    <span className="font-medium">{metrics.metadata.uploadStats.queueSize}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Chunk Progress:</span>
                    <span className="font-medium">{metrics.metadata.uploadStats.chunkProgress.toFixed(1)}%</span>
                </div>
            </div>

            {/* Visualization Steps */}
            <div className="mt-4 space-y-2">
                {Array.from(activeSteps).map((step) => (
                    <div key={step} className={`flex items-center space-x-2 p-2 rounded-md ${progress.status === UPLOAD_STATUS.COMPLETED ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span>{step}</span>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="mt-4 flex justify-end space-x-2">
                {progress.status === UPLOAD_STATUS.FAILED && onRetry && (
                    <button
                        onClick={() => handleAction(onRetry)}
                        disabled={isLoading}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        {isLoading ? 'Retrying...' : 'Retry'}
                    </button>
                )}

                {progress.status === UPLOAD_STATUS.UPLOADING && onPause && (
                    <button
                        onClick={() => handleAction(onPause)}
                        disabled={isLoading}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-yellow-50 text-yellow-600 hover:bg-yellow-100 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        {isLoading ? 'Pausing...' : 'Pause'}
                    </button>
                )}

                {progress.status === UPLOAD_STATUS.PAUSED && onResume && (
                    <button
                        onClick={() => handleAction(onResume)}
                        disabled={isLoading}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        {isLoading ? 'Resuming...' : 'Resume'}
                    </button>
                )}

                {progress.status === UPLOAD_STATUS.UPLOADING && onCancel && (
                    <button
                        onClick={() => handleAction(onCancel)}
                        disabled={isLoading}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        {isLoading ? 'Canceling...' : 'Cancel'}
                    </button>
                )}

                <button
                    onClick={() => handleAction(() => Promise.resolve())}
                    disabled={isLoading}
                    className="px-3 py-1 rounded-md text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400"
                >
                    {isLoading ? 'Loading...' : 'Refresh'}
                </button>
            </div>
        </div>
    );
};
