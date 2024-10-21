// src/types/logging.ts
import e from 'express';
import { LOG_LEVELS } from '../constants/logging';



export interface SystemContext {
  systemId: string;
  systemName: string;
  environment: 'development' | 'staging' | 'production';
}

export interface LogEntry extends SystemContext {
  tenantId?: string;
  userId: string;
  sessionId?: string;
  level: keyof typeof LOG_LEVELS;
  message: string;
  userMessage?: string;
  timestamp: string | Date;
  metadata: Record<string, unknown>;
}

