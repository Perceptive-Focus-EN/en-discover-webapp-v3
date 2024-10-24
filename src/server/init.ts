// src/server/init.ts
import { redisService } from '../services/cache/redisService';
import { monitoringManager } from '../MonitoringSystem/managers/MonitoringManager';

export async function initializeServer() {
  if (process.env.NODE_ENV !== 'development') {
    const cleanup = async () => {
      try {
        console.log('Starting server cleanup...');
        await redisService.cleanup();
        await monitoringManager.flush();
        await monitoringManager.destroy();
        console.log('Server cleanup completed');
      } catch (error) {
        console.error('Error during server cleanup:', error);
      } finally {
        process.exit(0);
      }
    };

    // Handle cleanup signals
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await cleanup();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (error) => {
      console.error('Unhandled Rejection:', error);
      await cleanup();
    });
  }
}