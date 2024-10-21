// src/lib/api_s/uploads/avatar.ts
import axiosInstance from '../../axiosSetup';
import { AxiosResponse } from 'axios';

interface AvatarUploadResponse {
  avatarUrl: string;
}

export const uploadAvatar = async (file: File): Promise<AvatarUploadResponse> => {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response: AxiosResponse<AvatarUploadResponse> = await axiosInstance.post('/api/auth/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};
