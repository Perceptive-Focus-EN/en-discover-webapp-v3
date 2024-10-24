// src/lib/api_s/uploads/avatar.ts
import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface AvatarUploadResponse {
  avatarUrl: string;
}

export const avatarApi = {
  upload: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axiosInstance.post('/api/auth/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    messageHandler.success('Avatar uploaded successfully');
    return response.data;
  }
};