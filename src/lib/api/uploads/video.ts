// src/lib/api_s/uploads/video.ts
import { api } from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface VideoUploadResponse {
  blobName: string;
  videoUrl: string;
  thumbnailUrl: string;
  processingStatus: 'queued' | 'processing' | 'completed' | 'failed';
}

export const videoApi = {
  upload: async (formData: FormData): Promise<VideoUploadResponse> => {
    const startTime = Date.now();
    try {
      const response = await api.post<VideoUploadResponse>(
        '/api/videos/upload',
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
          fileSize: formData.get('video') instanceof File ? (formData.get('video') as File).size : 0 
        }
      );

      return response;
    } catch (error) {
      const appError = monitoringManager.error.createError(
        'system',
        'VIDEO_UPLOAD_FAILED',
        'Video upload failed',
        { 
          error: error as Error,
          fileSize: formData.get('video') instanceof File ? (formData.get('video') as File).size : 0 
        }
      );
      monitoringManager.error.handleError(appError);
      throw error;
    }
  },

  getVideoUrl: async (blobName: string): Promise<{ videoUrl: string }> => {
    try {
      const response = await api.get<{ videoUrl: string }>(
        `/api/videos/${blobName}/url`
      );
      return response;
    } catch (error) {
      const appError = monitoringManager.error.createError(
        'system',
        'VIDEO_URL_FETCH_FAILED',
        'Failed to fetch video URL',
        { error: error as Error, blobName }
      );
      monitoringManager.error.handleError(appError);
      throw error;
    }
  }
};