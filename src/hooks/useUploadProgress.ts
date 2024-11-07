import { useState, useEffect } from 'react';
import { WebSocketMessage } from '../types/upload';
import { UPLOAD_WEBSOCKET } from '../constants/uploadConstants';
import { EnhancedProgress } from '@/services/ChunkingService';

interface UseUploadProgressReturn {
    progress: EnhancedProgress | null;
    error: Error | null;
    isConnected: boolean;
    metrics: {
        speed: string;
        timeRemaining: string;
        serverLoad: string;
    };
}

export const useUploadProgress = (
    trackingId: string,
    userId: string
): UseUploadProgressReturn => {
    const [progress, setProgress] = useState<EnhancedProgress | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const formatMetrics = (data: EnhancedProgress) => ({
        speed: `${(data.uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s`,
        timeRemaining: `${Math.ceil(data.estimatedTimeRemaining / 60)} minutes`,
        serverLoad: `${data.serverLoad.toFixed(2)} MB`
    });

    useEffect(() => {
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?userId=${userId}`);
        
        ws.onopen = () => {
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as WebSocketMessage;
                if (message.type === UPLOAD_WEBSOCKET.EVENTS.PROGRESS &&
                    message.data.trackingId === trackingId) {
                    // Cast to EnhancedProgress as it's coming from our enhanced service
                    setProgress(message.data as EnhancedProgress);
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to parse message'));
            }
        };

        ws.onerror = (error) => {
            setError(new Error('WebSocket error'));
            setIsConnected(false);
        };

        ws.onclose = () => {
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [trackingId, userId]);

    return {
        progress,
        error,
        isConnected,
        metrics: progress ? formatMetrics(progress) : {
            speed: '0 MB/s',
            timeRemaining: '0 minutes',
            serverLoad: '0 MB'
        }
    };
};