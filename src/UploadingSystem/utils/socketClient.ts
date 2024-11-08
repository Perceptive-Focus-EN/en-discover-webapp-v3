// src/utils/socketClient.ts
import io, { Socket } from 'socket.io-client';
import authManager from '../../utils/TokenManagement/authManager';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError } from '@/MonitoringSystem/constants/errors';

export class UploadSocketClient {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;

    constructor(
        private readonly userId: string,
        private readonly userTier: string,
        private readonly tenantId: string
    ) {}

    async connect(): Promise<void> {
        if (this.socket?.connected) return;

        try {
            const token = await authManager.getValidToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            this.socket = io({
                path: '/api/uploads/socket',
                transports: ['websocket'],
                auth: {
                    token
                },
                extraHeaders: {
                    'Authorization': `Bearer ${token}`
                },
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000
            });

            this.setupEventHandlers();
            this.setupTokenRefreshHandler();

        } catch (error) {
            monitoringManager.logger.error(
                new Error(SystemError.SOCKET_CONNECTION_FAILED),
                SystemError.SOCKET_CONNECTION_FAILED,
                { userId: this.userId, tenantId: this.tenantId }

            );
            throw error;
        }
    }

    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to upload server');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from upload server:', reason);
        });

        this.socket.on('migration:start', async (data) => {
            // Handle migration start
            console.log('Migration starting to node:', data.toNode);
            
            // Acknowledge migration
            this.socket?.emit('migration:ack', {
                nodeId: data.toNode
            });
        });

        this.socket.on('migration:complete', (data) => {
            console.log('Migration completed to node:', data.nodeId);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    private async handleTokenRefresh(): Promise<void> {
        try {
            const token = await authManager.getValidToken();
            if (!token) {
                this.disconnect();
                return;
            }

            // Emit new token to server
            this.socket?.emit('auth:refresh', { token });
        } catch (error) {
            // Handle reconnection if token refresh fails
            this.handleReconnection();
        }
    }

    private setupTokenRefreshHandler(): void {
        if (!this.socket) return;

        // Listen for token expiry notification from server
        this.socket.on('auth:token_expired', async () => {
            await this.handleTokenRefresh();
        });

        // Set up periodic token check
        setInterval(async () => {
            const token = await authManager.getValidToken();
            if (!token) {
                await this.handleTokenRefresh();
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    private async handleReconnection(): Promise<void> {
        try {
            await authManager.refreshAuth();
            await this.connect(); // Reconnect with new token
        } catch (error) {
            // If refresh fails, disconnect and possibly redirect to login
            this.disconnect();
            window.location.href = '/login';
        }
    }

    async startUpload(fileData: any): Promise<void> {
        if (!this.socket?.connected) {
            throw new Error('Not connected to upload server');
        }

        return new Promise((resolve, reject) => {
            this.socket?.emit('upload:start', fileData, (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve();
                }
            });
        });
    }

    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }
}