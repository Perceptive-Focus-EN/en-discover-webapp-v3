
// src/features/posts/hooks/usePostMedia.ts
import { useState, useCallback } from 'react';
import { uploadApi, UploadResponse } from '../api/uploadApi';

interface UsePostMediaReturn {
  uploadMedia: (file: File) => Promise<string>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// src/features/posts/hooks/usePostMedia.ts
export const usePostMedia = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadSingle = useCallback(async (file: File): Promise<UploadResponse> => {
    setIsUploading(true);
    setProgress(0);
    try {
      return await uploadApi.upload(file, (progress) => {
        setProgress(progress.percentage);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload media';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResponse[]> => {
    setIsUploading(true);
    setProgress(0);
    try {
      return await uploadApi.uploadMultiple(files, (progress) => {
        setProgress(progress.percentage);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload media';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadSingle,
    uploadMultiple,
    isUploading,
    progress,
    error,
    resetError: () => setError(null)
  };
};