// src/UploadingSystem/middleware/socketAuthMiddleware.ts
import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
import { DecodedToken } from '@/utils/TokenManagement/clientTokenUtils';
import WebSocket from 'ws';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { SubscriptionType } from '../services/SubscriptionService';

export interface AuthenticatedWebSocket extends WebSocket {
    userId: string;
    tenantId: string;
    userTier: string;
    subscriptionType: SubscriptionType; // Add this line
    isAuthenticated: boolean;
    token: string;
    session?: {
        sessionId: string;
        expiresAt: string;
    };
}

export const socketAuthMiddleware = async (
    ws: AuthenticatedWebSocket, 
    request: any
): Promise<boolean> => {
    try {
        const token = request.headers['authorization']?.replace('Bearer ', '');
        
        if (!token) {
            ws.close(4001, 'Authentication required');
            return false;
        }

        const decoded = await verifyAccessToken(token) as DecodedToken;
        if (!decoded || !decoded.userId) {
            ws.close(4002, 'Invalid token');
            return false;
        }

        // Verify session information
        if (!decoded.session?.sessionId || !decoded.session?.expiresAt) {
            ws.close(4002, 'Invalid session');
            return false;
        }

        // Check token expiration
        const expiryTime = new Date(decoded.exp * 1000).getTime();
        if (Date.now() >= expiryTime) {
            ws.close(4002, 'Token expired');
            return false;
        }

        // Attach full user context to socket
        ws.userId = decoded.userId;
        ws.tenantId = decoded.tenantId || '';
        ws.userTier = decoded.role || 'free';
        ws.isAuthenticated = true;
        ws.token = token;
        ws.session = {
            sessionId: decoded.session.sessionId,
            expiresAt: decoded.session.expiresAt
        };

        monitoringManager.metrics.recordMetric(
            MetricCategory.SECURITY,
            'socket',
            'connection_authenticated',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                userId: decoded.userId,
                tenantId: decoded.tenantId,
                role: decoded.role,
                ip: request.socket.remoteAddress
            }
        );

        return true;
    } catch (error) {
        monitoringManager.logger.error(error, SystemError.SOCKET_AUTH_FAILED, {
            ip: request.socket.remoteAddress,
            headers: request.headers
        });
        ws.close(4003, 'Authentication failed');
        return false;
    }
};