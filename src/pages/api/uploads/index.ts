// import { NextApiRequest, NextApiResponse } from 'next';
// import { IncomingForm } from 'formidable';
// import { BlobServiceClient, BlockBlobClient, RestError } from "@azure/storage-blob";
// import sharp from 'sharp';
// import { v4 as uuidv4 } from 'uuid';
// import { getCosmosClient } from '../../../config/azureCosmosClient';
// import { verifyAccessToken } from '@/utils/TokenManagement/serverTokenUtils';
// import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
// import { generateSasToken } from '../../../config/azureStorage';
// import { Readable } from 'stream';
// import { MetricCategory, MetricType, MetricUnit } from '../../../MonitoringSystem/constants/metrics';
// import { LogCategory, LogLevel } from '../../../MonitoringSystem/constants/logging';

// // Constants for chunked upload
// const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks
// const MAX_RETRIES = 3;
// const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds

// interface ChunkMetadata {
//   id: number;
//   start: number;
//   end: number;
//   size: number;
//   etag?: string;
// }

// class MonitoredUploadQueue {
//   private queue: Map<string, Promise<any>> = new Map();
//   private readonly UPLOAD_CIRCUIT = 'upload_handler';
//   private readonly MAX_QUEUE_SIZE = 100;

//   constructor() {
//     setInterval(() => {
//       monitoringManager.metrics.recordMetric(
//         MetricCategory.SYSTEM,
//         'upload_queue',
//         'size',
//         this.queue.size,
//         MetricType.GAUGE,
//         MetricUnit.COUNT,
//         { 
//           maxSize: this.MAX_QUEUE_SIZE,
//           circuit: this.UPLOAD_CIRCUIT 
//         }
//       );
//     }, 5000);
//   }

//   async enqueue(
//     key: string, 
//     operation: () => Promise<any>, 
//     metadata: Record<string, any>
//   ): Promise<any> {
//     try {
//       if (monitoringManager.error.circuitBreaker.isOpen(this.UPLOAD_CIRCUIT)) {
//         const error = monitoringManager.error.createError(
//           'system',
//           'UPLOAD_CIRCUIT_OPEN',
//           'Upload service is currently unavailable',
//           metadata
//         );
//         throw error;
//       }

//       if (this.queue.size >= this.MAX_QUEUE_SIZE) {
//         monitoringManager.metrics.recordMetric(
//           MetricCategory.SYSTEM,
//           'upload_queue',
//           'rejection',
//           1,
//           MetricType.COUNTER,
//           MetricUnit.COUNT,
//           metadata
//         );
        
//         const error = monitoringManager.error.createError(
//           'system',
//           'QUEUE_CAPACITY_EXCEEDED',
//           'Upload queue is full',
//           { queueSize: this.queue.size, ...metadata }
//         );
//         throw error;
//       }

//       if (this.queue.has(key)) {
//         monitoringManager.metrics.recordMetric(
//           MetricCategory.SYSTEM,
//           'upload_queue',
//           'deduplication',
//           1,
//           MetricType.COUNTER,
//           MetricUnit.COUNT,
//           metadata
//         );
        
//         monitoringManager.logger.info('Deduplicating upload request', {
//           uploadKey: key,
//           ...metadata
//         });
        
//         return this.queue.get(key);
//       }

//       const monitoredOperation = async () => {
//         const startTime = Date.now();
        
//         try {
//           const result = await operation();
          
//           monitoringManager.metrics.recordMetric(
//             MetricCategory.PERFORMANCE,
//             'upload',
//             'duration',
//             Date.now() - startTime,
//             MetricType.HISTOGRAM,
//             MetricUnit.MILLISECONDS,
//             { success: true, ...metadata }
//           );
          
//           monitoringManager.error.circuitBreaker.recordSuccess(this.UPLOAD_CIRCUIT);
          
//           return result;
          
//         } catch (error) {
//           monitoringManager.metrics.recordMetric(
//             MetricCategory.SYSTEM,
//             'upload',
//             'error',
//             1,
//             MetricType.COUNTER,
//             MetricUnit.COUNT,
//             { error: error.message, ...metadata }
//           );
          
//           monitoringManager.error.circuitBreaker.recordError(this.UPLOAD_CIRCUIT);
          
//           throw error;
          
//         } finally {
//           this.queue.delete(key);
          
//           monitoringManager.metrics.recordMetric(
//             MetricCategory.SYSTEM,
//             'upload_queue',
//             'size',
//             this.queue.size,
//             MetricType.GAUGE,
//             MetricUnit.COUNT,
//             metadata
//           );
//         }
//       };

//       const promise = monitoredOperation();
//       this.queue.set(key, promise);
//       return promise;

//     } catch (error) {
//       monitoringManager.logger.error(error, 'system/upload_queue_error', metadata);
//       throw error;
//     }
//   }
// }

// const uploadQueue = new MonitoredUploadQueue();

// async function uploadWithChunking(
//   file: any,
//   blockBlobClient: BlockBlobClient,
//   onProgress?: (progress: number) => void
// ): Promise<void> {
//   const fileSize = file.size;
//   const numberOfChunks = Math.ceil(fileSize / CHUNK_SIZE);
//   const blockIds: string[] = [];
  
//   const fileStream = Readable.from(file.filepath);
  
//   for (let i = 0; i < numberOfChunks; i++) {
//     const start = i * CHUNK_SIZE;
//     const end = Math.min(start + CHUNK_SIZE, fileSize);
//     const chunkSize = end - start;
    
//     const chunk: ChunkMetadata = {
//       id: i,
//       start,
//       end,
//       size: chunkSize
//     };

//     let retries = 0;
//     let success = false;

//     while (!success && retries < MAX_RETRIES) {
//       try {
//         const blockId = Buffer.from(`block-${chunk.id.toString().padStart(6, '0')}`)
//           .toString('base64');
//         blockIds.push(blockId);

//         const buffer = Buffer.alloc(chunk.size);
//         await new Promise((resolve, reject) => {
//           fileStream.read(chunk.size);
//           resolve(true);
//         });

//         await blockBlobClient.stageBlock(blockId, buffer, buffer.length);
        
//         success = true;
        
//         if (onProgress) {
//           const progress = Math.min(((i + 1) / numberOfChunks) * 100, 100);
//           onProgress(progress);
//         }
        
//       } catch (error) {
//         retries++;
//         if (retries === MAX_RETRIES) {
//           throw error;
//         }
        
//         const delay = Math.min(
//           RETRY_DELAY_BASE * Math.pow(2, retries) + Math.random() * 1000,
//           30000
//         );
//         await new Promise(resolve => setTimeout(resolve, delay));
//       }
//     }
//   }

//   await blockBlobClient.commitBlockList(blockIds, {
//     metadata: {
//       originalName: file.originalFilename,
//       contentType: file.mimetype,
//       uploadTimestamp: new Date().toISOString()
//     }
//   });
// }

// async function processLargeImageFile(
//   file: any,
//   blockBlobClient: BlockBlobClient,
//   trackingId: string
// ): Promise<any> {
//   const metadata: any = {};
  
//   if (file.size > CHUNK_SIZE) {
//     await uploadWithChunking(file, blockBlobClient, (progress) => {
//       monitoringManager.metrics.recordMetric(
//         'storage',
//         'upload_progress',
//         progress,
//         { trackingId }
//       );
//     });
    
//     const imageInfo = await sharp(file.filepath).metadata();
//     metadata.dimensions = {
//       width: imageInfo.width,
//       height: imageInfo.height
//     };
//   } else {
//     return processImageFile(file, blockBlobClient, trackingId);
//   }

//   setImmediate(async () => {
//     try {
//       await generateThumbnails(file, blockBlobClient, trackingId);
//     } catch (error) {
//       monitoringManager.error.handleError(error as Error);
//     }
//   });

//   return metadata;
// }

// async function generateThumbnails(
//   file: any,
//   blockBlobClient: BlockBlobClient,
//   trackingId: string
// ): Promise<void> {
//   const cosmosClient = await getCosmosClient();
//   const database = cosmosClient.database(process.env.COSMOS_DATABASE_NAME);
//   const fileTracking = database.collection('FileTracking');

//   for (const [size, dimensions] of Object.entries(FILE_TYPE_CONFIGS.image.thumbnailSizes)) {
//     try {
//       const thumbnailBuffer = await sharp(file.filepath)
//         .resize(dimensions.width, dimensions.height, {
//           fit: 'cover',
//           position: 'center'
//         })
//         .toBuffer();

//       const thumbnailBlobName = `${blockBlobClient.name.replace(/\.[^/.]+$/, '')}_${size}.jpg`;
//       const thumbnailBlockBlobClient = blockBlobClient.containerClient.getBlockBlobClient(
//         thumbnailBlobName
//       );
      
//       await thumbnailBlockBlobClient.uploadData(thumbnailBuffer);

//       await fileTracking.updateOne(
//         { _id: trackingId },
//         {
//           $set: {
//             [`thumbnails.${size}`]: thumbnailBlobName,
//             lastModified: new Date()
//           }
//         }
//       );
//     } catch (error) {
//       monitoringManager.error.handleError(error as Error);
//     }
//   }
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }

//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized: No token provided' });
//   }

//   const decodedToken = verifyAccessToken(token);
//   if (!decodedToken?.userId) {
//     return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//   }

//   // Set userId and tenantId from decoded token
//   const { userId, tenantId } = decodedToken;

//   const operationId = monitoringManager.logger.generateRequestId();
//   const startTime = Date.now();

//   try {
//     const uploadKey = `${userId}_${tenantId}_${file.originalFilename}`;
//     const metadata = {
//       operationId,
//       userId,
//       tenantId,
//       fileName: file.originalFilename,
//       fileSize: file.size,
//       mimeType: file.mimetype
//     };

//     monitoringManager.logger.info('Upload attempt initiated', {
//       ...metadata,
//       category: LogCategory.SYSTEM
//     });

//     const result = await uploadQueue.enqueue(
//       uploadKey,
//       async () => {
//         const trackingId = uuidv4();
//         const initialTracking = {
//           _id: trackingId,
//           status: 'initializing',
//           startTime: new Date(),
//           metadata
//         };

//         await fileTracking.insertOne(initialTracking);

//         const blobServiceClient = BlobServiceClient.fromConnectionString(
//           process.env.AZURE_STORAGE_CONNECTION_STRING!,
//           {
//             retryOptions: {
//               maxTries: 5,
//               tryTimeoutInMs: 60000,
//               retryDelayInMs: 1000
//             }
//           }
//         );

//         const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
//         const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//         let lease;
//         try {
//           lease = await blockBlobClient.acquireLease(30);
          
//           await uploadWithChunking(
//             file,
//             blockBlobClient,
//             (progress) => {
//               monitoringManager.metrics.recordMetric(
//                 MetricCategory.PERFORMANCE,
//                 'upload',
//                 'progress',
//                 progress,
//                 MetricType.GAUGE,
//                 MetricUnit.PERCENT,
//                 { trackingId, ...metadata }
//               );
//             }
//           );

//           await blockBlobClient.releaseLease(lease.leaseId);
          
//           return {
//             message: 'Upload successful',
//             trackingId,
//             duration: Date.now() - startTime
//           };

//         } catch (error) {
//           if (lease) {
//             await blockBlobClient.releaseLease(lease.leaseId);
//           }
//           throw error;
//         }
//       },
//       metadata
//     );

//     res.status(200).json(result);

//   } catch (error) {
//     const errorResponse = monitoringManager.error.handleError(error);
//     res.status(errorResponse.statusCode).json(errorResponse);
//   }
// }

// async function generateSasTokenWithMonitoring(
//   blobName: string,
//   containerName: string,
//   metadata: Record<string, any>
// ): Promise<string> {
//   const sasCircuit = 'sas_token_generation';
//   const operationId = monitoringManager.logger.generateRequestId();

//   try {
//     if (monitoringManager.error.circuitBreaker.isOpen(sasCircuit)) {
//       const error = monitoringManager.error.createError(
//         'security',
//         'SAS_CIRCUIT_OPEN',
//         'SAS token generation service is currently unavailable',
//         metadata
//       );
//       throw error;
//     }

//     monitoringManager.logger.info('SAS token generation attempt', {
//       operationId,
//       blobName,
//       containerName,
//       ...metadata,
//       category: LogCategory.SECURITY
//     });

//     const sasToken = await generateSasToken(blobName, containerName);

//     monitoringManager.metrics.recordMetric(
//       MetricCategory.SECURITY,
//       'sas_token_generation',
//       'success',
//       1,
//       MetricType.COUNTER,
//       MetricUnit.COUNT,
//       metadata
//     );

//     monitoringManager.error.circuitBreaker.recordSuccess(sasCircuit);

//     return sasToken;

//   } catch (error) {
//     monitoringManager.metrics.recordMetric(
//       MetricCategory.SECURITY,
//       'sas_token_generation',
//       'failure',
//       1,
//       MetricType.COUNTER,
//       MetricUnit.COUNT,
//       { error: error.message, ...metadata }
//     );

//     monitoringManager.error.circuitBreaker.recordError(sasCircuit);

//     monitoringManager.logger.error(error, 'security/sas_token_generation_error', metadata);

//     throw error;
//   }
// }