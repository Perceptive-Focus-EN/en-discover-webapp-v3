// src/pages/api/socketServer.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket as NetSocket } from 'net';
import { socketManager } from '@/UploadingSystem/managers/SocketManager';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

interface SocketServer extends HTTPServer {
    io?: SocketIOServer;
}

interface SocketWithIO extends NetSocket {
    server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
    socket: SocketWithIO;
}

const SocketHandler = async (req: NextApiRequest, res: NextApiResponseWithSocket) => {
    if (!res.socket.server.io) {
        const io = new SocketIOServer(res.socket.server, {
            path: '/api/uploads/socket',
            transports: ['websocket'],
            pingTimeout: 60000,
            pingInterval: 25000,
            maxHttpBufferSize: 1e8 // 100MB
        });

        res.socket.server.io = io;

        // Initialize socket manager with this server instance
        await setupSocketServer(io);

        // Handle cleanup
        const cleanup = async () => {
            try {
                console.log('Starting WebSocket cleanup...');
                await socketManager.shutdown();
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

async function setupSocketServer(io: SocketIOServer) {
    io.use(async (socket, next) => {
        try {
            // Extract user information from socket handshake
            const userId = socket.handshake.auth.userId;
            const userTier = socket.handshake.auth.userTier || 'free';
            const tenantId = socket.handshake.auth.tenantId;

            if (!userId || !tenantId) {
                return next(new Error('Authentication required'));
            }

            // Check if connection can be accepted
            const canConnect = await socketManager.handleConnection(socket, userId, userTier);
            if (!canConnect) {
                return next(new Error('Connection limit exceeded'));
            }

            // Add custom properties to socket
            Object.assign(socket, {
                userId,
                userTier,
                tenantId,
                connectionId: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });

            next();
        } catch (error) {
            monitoringManager.logger.error(error, 'SOCKET_CONNECTION_FAILED', {
                address: socket.handshake.address,
                timestamp: new Date()
            });
            next(error);
        }
    });

    io.on('connection', async (socket) => {
        try {
            // Log successful connection
            monitoringManager.logger.info('Client connected', {
                userId: socket.userId,
                connectionId: socket.connectionId
            });

            // Handle upload requests
            socket.on('upload:start', async (data) => {
                try {
                    await socketManager.handleUploadRequest(socket, data);
                } catch (error) {
                    socket.emit('upload:error', {
                        error: 'Upload failed to start',
                        details: error.message
                    });
                }
            });

            // Handle migration acknowledgments
            socket.on('migration:ack', (data) => {
                socket.emit('migration:confirmed', {
                    status: 'success',
                    nodeId: data.nodeId
                });
            });

            // Handle disconnection
            socket.on('disconnect', async () => {
                try {
                    await socketManager.handleDisconnection(socket);
                    monitoringManager.logger.info('Client disconnected', {
                        userId: socket.userId,
                        connectionId: socket.connectionId
                    });
                } catch (error) {
                    monitoringManager.logger.error(error, 'SOCKET_DISCONNECT_FAILED', {
                        userId: socket.userId,
                        connectionId: socket.connectionId
                    });
                }
            });

        } catch (error) {
            monitoringManager.logger.error(error, 'SOCKET_HANDLER_ERROR', {
                userId: socket.userId,
                connectionId: socket.connectionId
            });
            socket.disconnect(true);
        }
    });
}

export const config = {
    api: {
        bodyParser: false,
    },
};

export default SocketHandler;