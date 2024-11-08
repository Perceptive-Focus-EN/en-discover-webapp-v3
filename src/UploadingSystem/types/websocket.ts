import { UPLOAD_WEBSOCKET } from "@/UploadingSystem/constants/uploadConstants";
import { WebSocketProgress } from "./progress";

export type UploadWebSocketEvent = typeof UPLOAD_WEBSOCKET.EVENTS[keyof typeof UPLOAD_WEBSOCKET.EVENTS];

export interface WebSocketMessage {
    type: UploadWebSocketEvent;
    data: WebSocketProgress;
}

export interface WebSocketConnection {
    tenantId: string;
    userId: string;
    connectionId: string;
    connected: boolean;
    lastPing: number;
}