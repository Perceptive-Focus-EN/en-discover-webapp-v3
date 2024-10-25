// src/lib/api_s/uploads/photo.ts
import { api } from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';

interface PhotoUploadResponse {
  message: string;
  photoUrl: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export const photoApi = {
  upload: async (file: File, caption?: string): Promise<PhotoUploadResponse> => {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the maximum limit of 5MB');
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed');
    }

    const formData = new FormData();
    formData.append('photo', file);
    if (caption) {
      formData.append('caption', caption);
    }

    return api.post<PhotoUploadResponse>(
      API_ENDPOINTS.UPLOAD_PHOTO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
};