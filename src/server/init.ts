// // src/server/init.ts
// import { redisService } from '../services/cache/redisService';
// import { monitoringManager } from '../MonitoringSystem/managers/MonitoringManager';
// import { UploadWebSocketHandler } from '@/UploadingSystem/services/ChunkingService';
// import { createServer } from 'http';

// export async function initializeServer() {
//     // Create HTTP server and initialize WebSocket
//     const httpServer = createServer();
//     const wsHandler = UploadWebSocketHandler.getInstance(httpServer);
    
//     // Start WebSocket server
//     httpServer.listen(process.env.WEBSOCKET_PORT || 8080, () => {
//         console.log(`WebSocket server running on port ${process.env.WEBSOCKET_PORT || 8080}`);
//     });

//     if (process.env.NODE_ENV !== 'development') {
//         const cleanup = async () => {
//             try {
//                 console.log('Starting server cleanup...');
//                 // Close WebSocket connections
//                 await new Promise<void>((resolve) => {
//                     wsHandler.close(() => {
//                         console.log('WebSocket server closed');
//                         resolve();
//                     });
//                 });
//                 await redisService.cleanup();
//                 await monitoringManager.flush();
//                 await monitoringManager.destroy();
//                 // Close HTTP server
//                 await new Promise<void>((resolve) => {
//                     httpServer.close(() => {
//                         console.log('HTTP server closed');
//                         resolve();
//                     });
//                 });
//                 console.log('Server cleanup completed');
//             } catch (error) {
//                 console.error('Error during server cleanup:', error);
//             } finally {
//                 process.exit(0);
//             }
//         };

//         // Handle cleanup signals
//         process.on('SIGTERM', cleanup);
//         process.on('SIGINT', cleanup);

//         // Handle uncaught exceptions
//         process.on('uncaughtException', async (error) => {
//             console.error('Uncaught Exception:', error);
//             await cleanup();
//         });

//         // Handle unhandled promise rejections
//         process.on('unhandledRejection', async (error) => {
//             console.error('Unhandled Rejection:', error);
//             await cleanup();
//         });
//     }
// }