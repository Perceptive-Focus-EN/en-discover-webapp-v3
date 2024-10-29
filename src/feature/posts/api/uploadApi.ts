import { useState } from 'react';
import { clientApi } from '@/lib/api_s/client';
import { apiRequest } from '@/lib/api_s/client/utils';

import { useCallback } from 'react';
import { PhotoContent, VideoContent } from './types';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export interface UploadResponse {
  url: string;
  thumbnail?: string;
  type: 'image' | 'video';
  size: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface FormState {
    isProcessing: boolean;
    type?: 'PHOTO' | 'VIDEO';
    content?: PhotoContent | VideoContent;
}


export const uploadApi = {
  upload: async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');

    interface UploadApiResponse {
        data: UploadResponse;
    }

    interface UploadProgressEvent {
        loaded: number;
        total: number;
    }

    const response = await apiRequest.post<UploadApiResponse>('/api/uploads', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: UploadProgressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress({
                    loaded: progressEvent.loaded,
                    total: progressEvent.total,
                    percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
                });
            }
        }
    });

    return response.data.data;
  },

  uploadMultiple: async (
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse[]> => {
    return Promise.all(files.map(file => uploadApi.upload(file, onProgress)));
  }
};
