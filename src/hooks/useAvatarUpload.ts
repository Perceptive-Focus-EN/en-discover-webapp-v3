// src/hooks/useAvatarUpload.ts
import { useState, useEffect, useCallback } from 'react';
import { UploadResponse } from '../types/responses/UploadResponse';
import { api } from '../lib/axiosSetup';

interface AvatarResponse {
  avatarUrl: string;
}

export const useAvatarUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchAvatarUrl = useCallback(async () => {
    try {
      const response = await api.get<AvatarResponse>('/api/auth/user/avatar');
      setAvatarUrl(response.avatarUrl);
    } catch (err) {
      console.error('Failed to fetch avatar URL:', err);
      setError('Failed to load avatar. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchAvatarUrl();
  }, [fetchAvatarUrl]);

  const handleAvatarUpload = async (file: File): Promise<UploadResponse> => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post<UploadResponse>(
        '/api/auth/user/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      setIsUploading(false);
      await fetchAvatarUrl();
      return response;
    } catch (error) {
      setIsUploading(false);
      setError('Failed to upload avatar. Please try again.');
      throw error;
    }
  };

  return {
    avatarUrl,
    isUploading,
    error,
    handleAvatarUpload,
    refreshAvatarUrl: fetchAvatarUrl,
  };
};