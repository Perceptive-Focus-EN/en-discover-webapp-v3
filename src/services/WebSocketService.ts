// src/services/WebSocketService.ts
import { Server as WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

export class WebSocketService {
    private static instance: WebSocketService;
    private wss: WebSocketServer;
    private clients = new Map<string, Set<WebSocket>>();

    private constructor(server: HttpServer) {
        this.wss = new WebSocketServer({ server });
        this.setupWebSocket();
    }

    static getInstance(server: HttpServer): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService(server);
        }
        return WebSocketService.instance;
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws: WebSocket, req) => {
            const userId = this.getUserIdFromUrl(req.url);
            if (!userId) {
                ws.close(1008, 'Invalid userId');
                return;
            }

            this.addClient(userId, ws);

            ws.on('close', () => {
                this.removeClient(userId, ws);
            });
        });
    }

    private addClient(userId: string, ws: WebSocket) {
        if (!this.clients.has(userId)) {
            this.clients.set(userId, new Set());
        }
        this.clients.get(userId)!.add(ws);
    }

    private removeClient(userId: string, ws: WebSocket) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
                this.clients.delete(userId);
            }
        }
    }

    public notifyUploadProgress(userId: string, data: {
        trackingId: string;
        progress: number;
        chunksCompleted: number;
        totalChunks: number;
        uploadedBytes: number;
        totalBytes: number;
        status: string;
    }) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            const message = JSON.stringify({
                type: 'UPLOAD_PROGRESS',
                data
            });
            
            userClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }
}

export const wsService = WebSocketService.getInstance(server); // Initialize with your HTTP server