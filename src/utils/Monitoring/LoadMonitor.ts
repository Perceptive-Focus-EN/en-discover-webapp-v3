import { logger } from '../ErrorHandling/logger';
import { AppError } from '../../errors/AppError';
import { ERROR_CODES } from '../../constants/errorCodes';

interface ResourceUsage {
  cpu: number;
  memory: number;
  connections: number;
  timestamp: Date;
}

interface ServerHealth {
  serverId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: ResourceUsage;
}

export class LoadMonitor {
  private servers: Map<string, ServerHealth> = new Map();
  private readonly cpuThreshold = 80; // 80% CPU usage
  private readonly memoryThreshold = 85; // 85% memory usage
  private readonly connectionThreshold = 1000; // 1000 concurrent connections

  updateServerMetrics(serverId: string, metrics: ResourceUsage) {
    const status = this.calculateServerStatus(metrics);
    
    const health: ServerHealth = {
      serverId,
      status,
      lastCheck: new Date(),
      metrics
    };

    this.servers.set(serverId, health);
    this.checkServerHealth(health);
  }

  private calculateServerStatus(metrics: ResourceUsage): 'healthy' | 'degraded' | 'unhealthy' {
    if (
      metrics.cpu >= this.cpuThreshold ||
      metrics.memory >= this.memoryThreshold ||
      metrics.connections >= this.connectionThreshold
    ) {
      return 'unhealthy';
    }

    if (
      metrics.cpu >= this.cpuThreshold * 0.8 ||
      metrics.memory >= this.memoryThreshold * 0.8 ||
      metrics.connections >= this.connectionThreshold * 0.8
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  private checkServerHealth(health: ServerHealth) {
    if (health.status === 'unhealthy') {
      logger.error(new AppError({
        code: ERROR_CODES.SERVER.UNHEALTHY,
        message: `Server ${health.serverId} is unhealthy`,
        metadata: {
          serverId: health.serverId,
          metrics: health.metrics,
          timestamp: health.lastCheck
        }
      }));
    } else if (health.status === 'degraded') {
      logger.warn(`Server ${health.serverId} is degraded`, {
        serverId: health.serverId,
        metrics: health.metrics,
        timestamp: health.lastCheck
      });
    }
  }

  getServerHealth(serverId: string): ServerHealth | undefined {
    return this.servers.get(serverId);
  }

  getAllServersHealth(): ServerHealth[] {
    return Array.from(this.servers.values());
  }

  getSystemLoad(): {
    totalCpu: number;
    totalMemory: number;
    totalConnections: number;
    healthyServers: number;
  } {
    const servers = Array.from(this.servers.values());
    const healthyServers = servers.filter(s => s.status === 'healthy').length;

    return {
      totalCpu: servers.reduce((sum, server) => sum + server.metrics.cpu, 0) / servers.length,
      totalMemory: servers.reduce((sum, server) => sum + server.metrics.memory, 0) / servers.length,
      totalConnections: servers.reduce((sum, server) => sum + server.metrics.connections, 0),
      healthyServers
    };
  }
}