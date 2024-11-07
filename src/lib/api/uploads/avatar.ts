// src/lib/api_s/uploads/avatar.ts
import { api } from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';

interface AvatarUploadResponse {
  avatarUrl: string;
}

export const avatarApi = {
  upload: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.post<AvatarUploadResponse>(
      API_ENDPOINTS.UPLOAD_AVATAR, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
};