// src/components/UploadProgress.tsx
import { FC, useEffect, useState } from 'react';
import { useUploadProgress } from '../hooks/useUploadProgress';
import { formatBytes } from '../utils/formatters';
import { CHUNKING_CONFIG } from '../UploadingSystem/constants/uploadConstants';
import { UPLOAD_STATUS } from '../UploadingSystem/constants/uploadConstants';

interface UploadProgressProps {
    trackingId: string;
    userId: string;
    className?: string;
    onComplete?: () => void;
    onError?: (error: Error) => void;
    onPause?: () => Promise<void>;
    onResume?: () => Promise<void>;
    onRetry?: () => Promise<void>;
    onCancel?: () => Promise<void>;
}

export const UploadProgress: FC<UploadProgressProps> = ({ 
    trackingId, 
    userId, 
    className = '',
    onComplete,
    onError,
    onPause,
    onResume,
    onRetry,
    onCancel
}) => {
    const { progress, error, isConnected, metrics } = useUploadProgress(trackingId, userId);
    const [isLoading, setIsLoading] = useState(false);

    // Control handlers
    const handleAction = async (action: () => Promise<void>) => {
        if (!action) return;
        setIsLoading(true);
        try {
            await action();
        } catch (error) {
            onError?.(error as Error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (progress?.status === UPLOAD_STATUS.COMPLETED) {
            onComplete?.();
        }
        if (error) {
            onError?.(error);
        }
    }, [progress?.status, error, onComplete, onError]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case UPLOAD_STATUS.COMPLETED:
                return 'text-green-600 bg-green-50';
            case UPLOAD_STATUS.FAILED:
                return 'text-red-600 bg-red-50';
            case UPLOAD_STATUS.PAUSED:
                return 'text-yellow-600 bg-yellow-50';
            case UPLOAD_STATUS.UPLOADING:
                return 'text-blue-600 bg-blue-50';
            case UPLOAD_STATUS.RESUMING:
                return 'text-blue-600 bg-blue-50';
            case UPLOAD_STATUS.INITIALIZING:
                return 'text-gray-600 bg-gray-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">Error tracking upload: {error.message}</p>
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
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                <span className="text-sm text-gray-500">{metrics.speed}</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${(progress.uploadedBytes / progress.totalBytes) * 100}%` }}
                    />
                </div>
                <div className="mt-1 flex justify-between text-sm">
                    <span className="text-gray-600">
                        {progress.progress.toFixed(1)}%
                    </span>
                    <span className="text-gray-500">
                        {formatBytes(progress.uploadedBytes)}/{formatBytes(progress.totalBytes)}
                    </span>
                </div>
            </div>

            {/* Enhanced Metrics */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Time Remaining:</span>
                    <span className="font-medium">{metrics.timeRemaining}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Server Load:</span>
                    <span className="font-medium">{metrics.serverLoad}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Chunks:</span>
                    <span className="font-medium">
                        {progress.chunksCompleted} / {progress.totalChunks}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-md font-medium ${getStatusColor(progress.status)}`}>
                        {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
                    </span>
                </div>
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

                {progress.status !== UPLOAD_STATUS.COMPLETED && onCancel && (
                    <button
                        onClick={() => handleAction(onCancel)}
                        disabled={isLoading}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        {isLoading ? 'Canceling...' : 'Cancel'}
                    </button>
                )}
            </div>

            {/* Error Message */}
            {progress.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                    {progress.error}
                </div>
            )}
        </div>
    );
};