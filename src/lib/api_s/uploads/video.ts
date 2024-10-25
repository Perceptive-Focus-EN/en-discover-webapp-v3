// src/lib/api_s/uploads/video.ts
import { api } from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface VideoUploadResponse {
  blobName: string;
  videoUrl: string;
  processingStatus: 'queued' | 'processing' | 'completed' | 'failed' | 'pending' | 'unavailable';
  message: string;
}

interface VideoUrlResponse {
  videoUrl: string;
}

export const videoApi = {
  upload: async (file: File, caption?: string): Promise<VideoUploadResponse> => {
    const startTime = Date.now();
    const formData = new FormData();
    formData.append('video', file);
    if (caption) {
      formData.append('caption', caption);
    }

    try {
      messageHandler.info('Uploading video...');
      
      const response = await api.post<VideoUploadResponse>(
        '/api/posts/video',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'video',
        'upload_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          fileSize: file.size,
          hasCaption: !!caption,
          status: response.processingStatus
        }
      );

      messageHandler.success('Video uploaded successfully');
      return response;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'video',
        'upload_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          fileSize: file.size,
          error: error instanceof Error ? error.message : 'unknown'
        }
      );
      throw error;
    }
  },

  getUrl: async (blobName: string): Promise<string> => {
    try {
      const response = await api.get<VideoUrlResponse>(
        `/api/posts/getVideoUrl`,
        {
          params: {
            blobName: encodeURIComponent(blobName)
          }
        }
      );
      return response.videoUrl;
    } catch (error) {
      messageHandler.error('Failed to get video URL');
      throw error;
    }
  }
};