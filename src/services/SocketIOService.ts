// src/services/SocketIOService.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

export class SocketIOService {
    private static instance: SocketIOService;
    private io: SocketIOServer;

    private constructor(server: HttpServer) {
        this.io = new SocketIOServer(server);
        this.setupSocketIO();
    }

    static getInstance(server: HttpServer): SocketIOService {
        if (!SocketIOService.instance) {
            SocketIOService.instance = new SocketIOService(server);
        }
        return SocketIOService.instance;
    }

    // Method to extract userId from socket handshake query
    private getUserIdFromSocket(socket: Socket): string | null {
        const userId = socket.handshake.query.userId as string;
        return userId || null;
    }

    // Set up Socket.IO connections and room management
    private setupSocketIO() {
        this.io.on('connection', (socket) => {
            const userId = this.getUserIdFromSocket(socket);
            if (!userId) {
                socket.disconnect(true);
                return;
            }

            // Join a room named by userId
            socket.join(userId);

            // Remove from the room upon disconnect
            socket.on('disconnect', () => {
                socket.leave(userId);
            });
        });
    }

    // Send upload progress to a specific user by emitting to their room
    public notifyUploadProgress(userId: string, data: {
        trackingId: string;
        progress: number;
        chunksCompleted: number;
        totalChunks: number;
        uploadedBytes: number;
        totalBytes: number;
        status: string;
    }) {
        this.io.to(userId).emit('UPLOAD_PROGRESS', {
            type: 'UPLOAD_PROGRESS',
            data
        });
    }

    // Close the Socket.IO server
    public close(callback?: () => void): void {
        this.io.close(() => {
            console.log('Socket.IO server closed successfully');
            callback?.();
        });
    }
}

// HTTP server initialization and Socket.IO service instantiation
import { createServer } from 'http';

const server = createServer(); // Create your HTTP server instance
export const socketIOService = SocketIOService.getInstance(server); // Initialize with HTTP server
