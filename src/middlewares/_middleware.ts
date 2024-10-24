// src/pages/api/_middleware.ts


// Use this api only if you do not want to use the server/init.ts file to initialize the server and cleanup resources
// You can find the server/init.ts file in the src/server folder and next.config.mjs file in the root folder of the project

// 
// 
// import { NextResponse } from 'next/server';
// import { redisService } from '../../services/cache/redisService';
// import { monitoringManager } from '../../MonitoringSystem/managers/MonitoringManager';
// 
// if (process.env.NODE_ENV !== 'development') {
//   const cleanup = async () => {
    // try {
    //   await redisService.cleanup();
    //   await monitoringManager.flush();
    //   await monitoringManager.destroy();
    // } catch (error) {
    //   console.error('Cleanup error:', error);
    // } finally {
    //   process.exit(0);
    // }
//   };
// 
//   process.on('SIGTERM', cleanup);
//   process.on('SIGINT', cleanup);
// }
// 
// export function middleware() {
//   return NextResponse.next();
// }