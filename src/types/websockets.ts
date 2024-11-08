import { UPLOAD_WEBSOCKET } from "@/UploadingSystem/constants/uploadConstants";
import { UploadProgressData } from "../UploadingSystem/types/upload";



export type UploadWebSocketEvent = typeof UPLOAD_WEBSOCKET.EVENTS[keyof typeof UPLOAD_WEBSOCKET.EVENTS];

export interface WebSocketMessage {
    type: UploadWebSocketEvent;
    data: UploadProgressData;
}
