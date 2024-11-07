// // src/feature/posts/api/uploadApi.ts
// // import { clientApi } from '@/lib/api_s/client';
// import { apiRequest, ApiResponse, isApiError, extractErrorMessage } from '@/lib/api/client/utils';
// import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
// import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
// import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
// import { UploadResponse } from '@/types/Resources/api';

// export interface UploadProgress {
//  loaded: number;
//  total: number;
//  percentage: number;
// }

// export const MAX_FILE_SIZE = {
//  image: 5 * 1024 * 1024, // 5MB
//  video: 100 * 1024 * 1024 // 100MB
// };

// export const ALLOWED_TYPES = {
//  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
//  video: ['video/mp4', 'video/webm', 'video/quicktime']
// };

// export const uploadApi = {
//  uploadMultiple: async (
//   files: File[],
//   onProgress?: (progress: UploadProgress) => void
//  ): Promise<UploadResponse[]> => {
//   const responses: UploadResponse[] = [];
//   let totalLoaded = 0;
//   const totalSize = files.reduce((acc, file) => acc + file.size, 0);

//   for (const file of files) {
//     const response = await uploadApi.upload(file, (progress) => {
//      if (onProgress) {
//       totalLoaded += progress.loaded;
//       onProgress({
//         loaded: totalLoaded,
//         total: totalSize,
//         percentage: Math.round((totalLoaded * 100) / totalSize)
//       });
//      }
//     });
//     responses.push(response);
//   }

//   return responses;
//  },

//  upload: async (
//   file: File,
//   onProgress?: (progress: UploadProgress) => void
//  ): Promise<UploadResponse> => {
//   const isImage = ALLOWED_TYPES.image.includes(file.type);
//   const isVideo = ALLOWED_TYPES.video.includes(file.type);

//   if (!isImage && !isVideo) {
//     return {
//      data: {
//       url: '',
//       type: '',
//       size: 0,
//       filename: '',
//       processingStatus: undefined,
//       metadata: {
//         originalName: '',
//         mimeType: '',
//         uploadedAt: new Date().toISOString()
//       }
//      },
//      message: 'Invalid file type'
//     };
//   }

//   const maxSize = isImage ? MAX_FILE_SIZE.image : MAX_FILE_SIZE.video;
//   if (file.size > maxSize) {
//     return {
//      data: {
//       url: '',
//       type: '',
//       size: 0,
//       filename: '',
//       processingStatus: undefined,
//       metadata: {
//         originalName: '',
//         mimeType: '',
//         uploadedAt: new Date().toISOString()
//       }
//      },
//      message: 'File size exceeds limit'
//     };
//   }

//   const formData = new FormData();
//   formData.append('file', file);
//   formData.append('type', isVideo ? 'video' : 'image');

//    try {
//      console.log('Starting upload for file:', file.name);

//     const response = await apiRequest.post<UploadResponse>('/api/uploads', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       onUploadProgress: (progressEvent: { loaded: number; total: number }) => {
//          if (onProgress && progressEvent.total) {
//            const progress = {
//              loaded: progressEvent.loaded,
//              total: progressEvent.total,
//              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
//            };
//            onProgress(progress);

//            monitoringManager.metrics.recordMetric(
//              MetricCategory.PERFORMANCE,
//              'upload_progress',
//              progress.percentage.toString(),
//              1,
//              MetricType.COUNTER,
//              MetricUnit.PERCENTAGE,
//              {
//                fileType: file.type,
//                fileSize: file.size,
//              }
//            );
//          }
//        },
//      });

//      console.log('Upload response:', response);

//          // Match API response structure
//          if (!response.data) {
//             throw new Error('Invalid response format: missing data');
//           }
    
//           // Return the response data directly
//           return response.data;
//         } catch (error) {
//           console.error('Upload error:', error);
//           const errorMessage = isApiError(error) ? extractErrorMessage(error) : 'Failed to upload file';
//           messageHandler.error(errorMessage);
    
//           // Record failure metric
//           monitoringManager.metrics.recordMetric(
//            MetricCategory.BUSINESS,
//            'upload_failure',
//            'error',
//            1,
//            MetricType.COUNTER,
//            MetricUnit.COUNT,
//            {
//             fileType: file.type,
//             fileSize: file.size,
//             error: errorMessage
//            }
//           );
//           throw error;
//         }
//  }
// };


// export default uploadApi;
// ;
