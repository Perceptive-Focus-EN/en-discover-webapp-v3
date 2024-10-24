// src/lib/api_s/uploads/video.ts
import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

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
    const formData = new FormData();
    formData.append('video', file);
    if (caption) {
      formData.append('caption', caption);
    }

    messageHandler.info('Uploading video...');
    const response = await axiosInstance.post('/api/posts/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    messageHandler.success('Video uploaded successfully');
    return response.data;
  },

  getUrl: async (blobName: string): Promise<string> => {
    const response = await axiosInstance.get(
      `/api/posts/getVideoUrl?blobName=${encodeURIComponent(blobName)}`
    );
    return response.data.videoUrl;
  }
};