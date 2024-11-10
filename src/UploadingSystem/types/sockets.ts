import { UPLOAD_EVENTS } from "@/UploadingSystem/constants/uploadConstants";
import { SocketIOProgress } from "./progress";

export type UploadSocketIOEvent = typeof UPLOAD_EVENTS[keyof typeof UPLOAD_EVENTS];

// Defines the structure of the message sent over Socket.IO
export interface SocketIOMessage {
    type: UploadSocketIOEvent;
    data: SocketIOProgress;
}

// Structure for managing a Socket.IO connection
export interface SocketIOConnection {
    tenantId: string;
    userId: string;
    socketId: string; // Socket.IO connection identifier
    connected: boolean;
    lastPing: number;
}
