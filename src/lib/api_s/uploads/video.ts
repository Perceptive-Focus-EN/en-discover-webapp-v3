// src/lib/api_s/uploads/video.ts

import axiosInstance from '../../axiosSetup';
import { AxiosResponse } from 'axios';

interface VideoUploadResponse {
  blobName: string;
  videoUrl: string;
  processingStatus: 'queued' | 'processing' | 'completed' | 'failed' | 'pending' | 'unavailable';
  message: string;
}

interface VideoUrlResponse {
  videoUrl: string;
}

export const uploadVideo = async (file: File, caption?: string): Promise<VideoUploadResponse> => {
  const formData = new FormData();
  formData.append('video', file);
  if (caption) {
    formData.append('caption', caption);
  }

  try {
    const response: AxiosResponse<VideoUploadResponse> = await axiosInstance.post('/api/posts/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export const getVideoUrl = async (blobName: string): Promise<string> => {
  try {
    const response: AxiosResponse<VideoUrlResponse> = await axiosInstance.get(`/api/posts/getVideoUrl?blobName=${encodeURIComponent(blobName)}`);
    return response.data.videoUrl;
  } catch (error) {
    console.error('Error fetching video URL:', error);
    throw error;
  }
};