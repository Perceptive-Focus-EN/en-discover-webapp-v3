// First, create src/lib/api_s/monitoring.ts
import axiosInstance from './axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface PerformanceMetric {
  endpoint: string;
  averageResponseTime: number;
  errorCount: number;
  requestCount: number;
}

interface SystemHealth {
  totalCpu: number;
  totalMemory: number;
  totalConnections: number;
  healthyServers: number;
}

export const monitoringApi = {
  getPerformanceMetrics: async (): Promise<PerformanceMetric[]> => {
    const response = await axiosInstance.get('/api/monitoring/performance');
    return response.data;
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await axiosInstance.get('/api/monitoring/health');
    return response.data;
  }
};