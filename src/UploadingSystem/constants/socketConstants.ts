// src/UploadingSystem/constants/socketConstants.ts
export const SOCKET_PATHS = {
    UPLOAD: '/api/uploads/socket',
    SERVER: '/api/socketServer',
    VISUALIZATION: '/api/socketio'
} as const;

export const SOCKET_EVENTS = {
    UPLOAD: {
        START: 'upload:start',
        PROGRESS: 'upload:progress',
        COMPLETE: 'upload:complete',
        ERROR: 'upload:error'
    },
    VISUALIZATION: {
        UPDATE: 'visualization:update',
        METRICS: 'visualization:metrics',
        SIMULATION: 'visualization:simulate'
    },
    AUTH: {
        REFRESH: 'auth:refresh',
        EXPIRED: 'auth:expired'
    },
    SYSTEM: {
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
        ERROR: 'error'
    }
} as const;


export const SOCKET_CONFIG = {
    PATH: '/api/socketio',
    EVENTS: {
        UPLOAD: {
            START: 'upload:start',
            PROGRESS: 'upload:progress',
            COMPLETE: 'upload:complete',
            ERROR: 'upload:error'
        },
        SYSTEM: {
            CONNECT: 'connect',
            DISCONNECT: 'disconnect',
            ERROR: 'error'
        }
    },
    RECONNECT: {
        MAX_ATTEMPTS: 5,
        INITIAL_DELAY: 1000,
        MAX_DELAY: 30000
    }
} as const;