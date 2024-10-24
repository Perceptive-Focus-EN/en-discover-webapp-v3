// src/lib/api_s/uploads/photo.ts
import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface PhotoUploadResponse {
  message: string;
  photoUrl: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export const photoApi = {
  upload: async (file: File, caption?: string): Promise<PhotoUploadResponse> => {
    if (!file) {
      messageHandler.error('No file provided');
      throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      messageHandler.error('File size exceeds the maximum limit of 5MB');
      throw new Error('File size exceeds the maximum limit of 5MB');
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      messageHandler.error('Invalid file type. Only JPEG, PNG, and GIF are allowed');
      throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed');
    }

    const formData = new FormData();
    formData.append('photo', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await axiosInstance.post('/api/posts/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    messageHandler.success('Photo uploaded successfully');
    return response.data;
  }
};
