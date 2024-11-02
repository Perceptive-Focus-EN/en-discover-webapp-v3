import { useState, useCallback } from 'react';
import { uploadApi, UploadProgress, MAX_FILE_SIZE, ALLOWED_TYPES } from '../api/uploadApi';
import { isApiError, extractErrorMessage } from '@/lib/api_s/client/utils';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { UploadResponse } from '@/types/Resources/api';

interface UsePostMediaReturn {
  uploadSingle: (file: File) => Promise<UploadResponse>;
  uploadMultiple: (files: File[]) => Promise<UploadResponse[]>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  resetError: () => void;
  isProcessing: boolean;
  processingProgress: number;
}

interface UsePostMediaProps {
  onSuccess?: (response: UploadResponse) => void;
  onMultipleSuccess?: (responses: UploadResponse[]) => void;
}

export const usePostMedia = ({ onSuccess, onMultipleSuccess }: UsePostMediaProps = {}): UsePostMediaReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleProgress = useCallback((progress: UploadProgress) => {
    setProgress(progress.percentage);

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'upload_progress_update',
      progress.percentage.toString(),
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        loaded: progress.loaded,
        total: progress.total,
      }
    );
  }, []);

  const uploadSingle = useCallback(async (file: File): Promise<UploadResponse> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setProcessingProgress(0);

    const startTime = Date.now();

    const isImage = ALLOWED_TYPES.image.includes(file.type);
    const isVideo = ALLOWED_TYPES.video.includes(file.type);

    if (!isImage && !isVideo) {
      const errorMessage = 'Invalid file type';
      setError(errorMessage);
      messageHandler.error(errorMessage);
      setIsUploading(false);
      throw new Error(errorMessage);
    }

    const maxSize = isImage ? MAX_FILE_SIZE.image : MAX_FILE_SIZE.video;
    if (file.size > maxSize) {
      const errorMessage = 'File size exceeds limit';
      setError(errorMessage);
      messageHandler.error(errorMessage);
      setIsUploading(false);
      throw new Error(errorMessage);
    }

    try {
      const response = await uploadApi.upload(file, handleProgress);

      if (!response.data?.url) {
        throw new Error('Upload response missing URL');
      }

      console.log('Upload successful:', {
        url: response.data.url,
        type: response.data.type,
        filename: response.data.filename,
      });

      if (file.type.startsWith('video/') && response.data.processingStatus) {
        setIsProcessing(true);
        setProcessingProgress(0);
        
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'media_processing',
          'started',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            fileType: file.type,
            fileSize: file.size,
            processingStatus: response.data.processingStatus,
          }
        );
      }

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'media_upload',
        'success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          type: 'single',
          fileType: file.type,
          fileSize: file.size,
          duration: Date.now() - startTime,
          hasUrl: Boolean(response.data.url),
          mimeType: response.data.metadata.mimeType,
        }
      );

      if (onSuccess) {
        onSuccess(response);
      }

      return response;

    } catch (err) {
      const errorMessage = isApiError(err) ? extractErrorMessage(err) : 'Failed to upload media';
      setError(errorMessage);
      messageHandler.error(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'media_upload',
        'failure',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          type: 'single',
          fileType: file.type,
          fileSize: file.size,
          error: errorMessage,
          errorType: err instanceof Error ? err.name : 'unknown',
        }
      );

      throw err;
    } finally {
      setIsUploading(false);
      if (!file.type.startsWith('video/')) {
        setIsProcessing(false);
      }
    }
  }, [handleProgress, onSuccess]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResponse[]> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setProcessingProgress(0);

    for (const file of files) {
      const isImage = ALLOWED_TYPES.image.includes(file.type);
      const isVideo = ALLOWED_TYPES.video.includes(file.type);

      if (!isImage && !isVideo) {
        const errorMessage = `Invalid file type for ${file.name}`;
        setError(errorMessage);
        messageHandler.error(errorMessage);
        setIsUploading(false);
        throw new Error(errorMessage);
      }

      const maxSize = isImage ? MAX_FILE_SIZE.image : MAX_FILE_SIZE.video;
      if (file.size > maxSize) {
        const errorMessage = `File size exceeds limit for ${file.name}`;
        setError(errorMessage);
        messageHandler.error(errorMessage);
        setIsUploading(false);
        throw new Error(errorMessage);
      }
    }

    const startTime = Date.now();
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    try {
      const responses = await uploadApi.uploadMultiple(files, handleProgress);

      responses.forEach((response) => {
        if (!response.data?.url) {
          throw new Error('Upload response missing URL');
        }
      });

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'media_upload',
        'success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          type: 'multiple',
          fileCount: files.length,
          totalSize,
          duration: Date.now() - startTime,
          hasAllUrls: responses.every((r) => Boolean(r.data?.url)),
        }
      );

      if (onMultipleSuccess) {
        onMultipleSuccess(responses);
      }

      return responses;
    } catch (err) {
      const errorMessage = isApiError(err) ? extractErrorMessage(err) : 'Failed to upload multiple media files';
      setError(errorMessage);
      messageHandler.error(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'media_upload',
        'failure',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          type: 'multiple',
          fileCount: files.length,
          totalSize,
          error: errorMessage,
          errorType: err instanceof Error ? err.name : 'unknown',
        }
      );

      throw err;
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [handleProgress, onMultipleSuccess]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadSingle,
    uploadMultiple,
    isUploading,
    isProcessing,
    progress,
    processingProgress,
    error,
    resetError,
  };
};
