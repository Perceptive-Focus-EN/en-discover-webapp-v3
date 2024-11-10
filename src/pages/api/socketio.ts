// src/pages/api/socketio.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket as NetSocket } from 'net';
import { ChunkingService } from '@/UploadingSystem/services/ChunkingService';
import { SOCKET_CONFIG } from '@/UploadingSystem/constants/socketConstants';

interface SocketServer extends HTTPServer {
    io?: SocketIOServer;
}

interface SocketWithIO extends NetSocket {
    server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
    socket: SocketWithIO;
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
    if (!res.socket.server.io) {
        console.log('Initializing Socket.IO server...');
        
        const io = new SocketIOServer(res.socket.server, {
            path: SOCKET_CONFIG.PATH,
            addTrailingSlash: false,
            cors: {
                origin: process.env.NEXT_PUBLIC_WS_URL,
                methods: ["GET", "POST"]
            }
        });

        const chunkingService = ChunkingService.getInstance();

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            const trackingId = socket.handshake.query.trackingId as string;
            if (trackingId) {
                socket.join(`upload:${trackingId}`);

                // Forward ChunkingService events to socket
                const progressHandler = (data: any) => {
                    if (data.trackingId === trackingId) {
                        socket.emit(SOCKET_CONFIG.EVENTS.UPLOAD.PROGRESS, data);
                    }
                };

                const errorHandler = (error: any) => {
                    if (error.trackingId === trackingId) {
                        socket.emit(SOCKET_CONFIG.EVENTS.UPLOAD.ERROR, error);
                    }
                };

                chunkingService.on('progress', progressHandler);
                chunkingService.on('error', errorHandler);

                socket.on('disconnect', () => {
                    console.log('Client disconnected:', socket.id);
                    chunkingService.removeListener('progress', progressHandler);
                    chunkingService.removeListener('error', errorHandler);
                });
            }
        });

        res.socket.server.io = io;

        // Handle cleanup
        const cleanup = async () => {
            try {
                console.log('Starting WebSocket cleanup...');
                await new Promise<void>((resolve) => {
                    io.close(() => {
                        console.log('WebSocket connections closed');
                        resolve();
                    });
                });
            } catch (error) {
                console.error('Error during WebSocket cleanup:', error);
            }
        };

        // Handle server shutdown
        process.on('SIGTERM', cleanup);
        process.on('SIGINT', cleanup);
    }

    res.end();
};

export const config = {
    api: {
        bodyParser: false,
    },
};

export default SocketHandler;