import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../ErrorHandling/logger';
import { PerformanceMonitor } from './PerformanceMonitor';
import { UserAnalytics } from '../Analytics/UserAnalytics';
import { LoadMonitor } from './LoadMonitor';
import { AppError } from '../../errors/AppError';
import { ERROR_CODES } from '../../constants/errorCodes';

export class ApiMonitoring {
  private static instance: ApiMonitoring;
  private performanceMonitor: PerformanceMonitor;
  private userAnalytics: UserAnalytics;
  private loadMonitor: LoadMonitor;

  private constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.userAnalytics = new UserAnalytics();
    this.loadMonitor = new LoadMonitor();

    // Start system monitoring
    this.startSystemMonitoring();
  }

  public static getInstance(): ApiMonitoring {
    if (!ApiMonitoring.instance) {
      ApiMonitoring.instance = new ApiMonitoring();
    }
    return ApiMonitoring.instance;
  }

  private startSystemMonitoring() {
    setInterval(() => {
      const metrics = {
        cpu: process.cpuUsage().user / 1000000,
        memory: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100,
        connections: 0, // Will be set by your server instance
        timestamp: new Date()
      };

      this.loadMonitor.updateServerMetrics(process.env.SERVER_ID || 'default', metrics);
    }, 30000);
  }

  // Middleware wrapper for Next.js API routes
  public createApiMiddleware() {
    return async (
      req: NextApiRequest,
      res: NextApiResponse,
      next: () => Promise<void>
    ) => {
      const start = Date.now();
      const path = req.url || 'unknown';

      try {
        // Log the incoming request
        logger.info('API Request', {
          path,
          method: req.method,
          query: req.query,
          headers: req.headers,
          userId: req.headers['user-id'],
          tenantId: req.headers['tenant-id'],
        });

        // Track request start
        this.performanceMonitor.trackRequest(path, 0, true);

        // Execute the API handler
        await next();

        // Calculate duration and track successful completion
        const duration = Date.now() - start;
        this.performanceMonitor.trackRequest(path, duration, true);

        // Track user activity if user is authenticated
        const userId = req.headers['user-id'];
        if (userId) {
          this.userAnalytics.trackUserAction(
            userId.toString(),
            'api_call',
            path,
            {
              method: req.method,
              duration,
              status: res.statusCode,
              success: true
            }
          );
        }

        // Log the successful response
        logger.info('API Response', {
          path,
          method: req.method,
          duration,
          status: res.statusCode,
          userId: req.headers['user-id'],
          tenantId: req.headers['tenant-id'],
        });

      } catch (error) {
        const duration = Date.now() - start;
        this.performanceMonitor.trackRequest(path, duration, false);

        // Log the error
        if (error instanceof AppError) {
          logger.error(error, {
            path,
            method: req.method,
            duration,
          });
        } else {
          logger.error(new AppError({
            code: ERROR_CODES.API.REQUEST_FAILED,
            message: (error as Error).message || 'API request failed',
            metadata: {
              path,
              method: req.method,
              duration,
              originalError: error
            }
          }));
        }

        throw error;
      }
    };
  }

  // Get monitoring data
  public getPerformanceMetrics(endpoint?: string) {
    if (endpoint) {
      return this.performanceMonitor.getMetrics(endpoint);
    }
    return this.performanceMonitor.getAllMetrics();
  }

  public getUserAnalytics(userId: string) {
    return this.userAnalytics.generateUserReport(userId);
  }

  public getSystemHealth() {
    return this.loadMonitor.getSystemLoad();
  }
}

export const apiMonitoring = ApiMonitoring.getInstance();