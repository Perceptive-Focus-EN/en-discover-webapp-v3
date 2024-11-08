import { UPLOAD_WEBSOCKET } from "@/constants/uploadConstants";
import { UploadProgressData } from "./upload";



export type UploadWebSocketEvent = typeof UPLOAD_WEBSOCKET.EVENTS[keyof typeof UPLOAD_WEBSOCKET.EVENTS];

export interface WebSocketMessage {
    type: UploadWebSocketEvent;
    data: UploadProgressData;
}
