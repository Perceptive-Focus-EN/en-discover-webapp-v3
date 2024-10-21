import { useState, useEffect, useCallback } from 'react';
import { UploadResponse } from '../types/responses/UploadResponse';
import axiosInstance, { isAxiosError } from 'axios';

export const useAvatarUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchAvatarUrl = useCallback(async () => {
    try {
      const response = await axiosInstance.get<{ avatarUrl: string }>('/api/auth/user/avatar');
      setAvatarUrl(response.data.avatarUrl);
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
      const response = await axiosInstance.post<UploadResponse>('/api/auth/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsUploading(false);
      await fetchAvatarUrl();
      return response.data;
    } catch (err) {
      setIsUploading(false);
      if (isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to upload avatar. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw err;
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
