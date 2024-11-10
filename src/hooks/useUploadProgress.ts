
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { UPLOAD_SOCKET_IO } from '@/UploadingSystem/constants/uploadConstants';
import { EnhancedProgress } from '@/UploadingSystem/types/progress';
import { SocketIOMessage } from '@/UploadingSystem/types/sockets';

interface UseUploadProgressReturn {
    progress: EnhancedProgress | null;
    error: Error | null;
    isConnected: boolean;
    metrics: {
        speed: string;
        timeRemaining: string;
        serverLoad: string;
    };
    retry: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || '/api/socketio';

export const useUploadProgress = (
    trackingId: string,
    userId: string
): UseUploadProgressReturn => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [progress, setProgress] = useState<EnhancedProgress | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const formatMetrics = useCallback((data: EnhancedProgress) => ({
        speed: `${(data.uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s`,
        timeRemaining: `${Math.ceil(data.estimatedTimeRemaining / 60)} minutes`,
        serverLoad: `${data.serverLoad.toFixed(2)} MB`
    }), []);

    useEffect(() => {
        let socketInstance: Socket;
        
        const initSocket = async () => {
            // Ensure socket server is ready
            try {
                await fetch('/api/socketio');
                
                socketInstance = io(SOCKET_URL, {
                    path: '/api/socketio',
                    addTrailingSlash: false,
                    query: { userId, trackingId },
                    transports: ['socketio'],
                    reconnectionAttempts: UPLOAD_SOCKET_IO.RECONNECT.MAX_ATTEMPTS,
                    reconnectionDelay: UPLOAD_SOCKET_IO.RECONNECT.INITIAL_DELAY,
                    reconnectionDelayMax: UPLOAD_SOCKET_IO.RECONNECT.MAX_DELAY,
                    auth: {
                        userId,
                        trackingId
                    }
                });

                // Socket event handlers
                socketInstance.on('connect', () => {
                    console.log('Socket connected for upload:', trackingId);
                    setIsConnected(true);
                    setError(null);
                    
                    // Join upload-specific room
                    socketInstance.emit('joinUpload', { trackingId, userId });
                });

                socketInstance.on('disconnect', () => {
                    console.log('Socket disconnected for upload:', trackingId);
                    setIsConnected(false);
                });

                socketInstance.io.on('error', (err) => {
                    console.error('Socket error:', err);
                    setError(new Error(err.message));
                    setIsConnected(false);
                });

                // Upload-specific event handlers
                socketInstance.on(UPLOAD_SOCKET_IO.EVENTS.PROGRESS, (message: SocketIOMessage) => {
                    if (message.data.trackingId === trackingId) {
                        setProgress(message.data as EnhancedProgress);
                    }
                });

                socketInstance.on(UPLOAD_SOCKET_IO.EVENTS.CHUNK_COMPLETE, (data) => {
                    if (data.trackingId === trackingId) {
                        setProgress(prev => prev ? {
                            ...prev,
                            chunksCompleted: (prev.chunksCompleted || 0) + 1,
                            uploadedBytes: data.uploadedBytes,
                            timestamp: Date.now()
                        } : null);
                    }
                });

                socketInstance.on(UPLOAD_SOCKET_IO.EVENTS.COMPLETE, (data) => {
                    if (data.trackingId === trackingId) {
                        setProgress(prev => prev ? {
                            ...prev,
                            progress: 100,
                            status: 'completed',
                            timestamp: Date.now()
                        } : null);
                    }
                });

                socketInstance.on(UPLOAD_SOCKET_IO.EVENTS.FAILED, (data) => {
                    if (data.trackingId === trackingId) {
                        setError(new Error(data.message));
                        console.error('Upload error:', data.message);
                    }
                });

                setSocket(socketInstance);
            } catch (err) {
                console.error('Failed to initialize socket:', err);
                setError(err instanceof Error ? err : new Error('Failed to initialize socket'));
            }
        };

        initSocket();

        // Cleanup
        return () => {
            if (socketInstance) {
                console.log('Cleaning up socket for upload:', trackingId);
                socketInstance.emit('leaveUpload', { trackingId, userId });
                socketInstance.disconnect();
            }
        };
    }, [trackingId, userId]);

    const handleRetry = useCallback(() => {
        if (socket && socket.connected) {
            console.log('Retrying upload:', trackingId);
            socket.emit(UPLOAD_SOCKET_IO.EVENTS.RETRY, { trackingId, userId });
        } else {
            console.warn('Cannot retry - socket not connected');
            setError(new Error('Connection lost. Please try again.'));
        }
    }, [socket, trackingId, userId]);

    return {
        progress,
        error,
        isConnected,
        metrics: progress ? formatMetrics(progress) : {
            speed: '0 MB/s',
            timeRemaining: '0 minutes',
            serverLoad: '0 MB'
        },
        retry: handleRetry
    };
};