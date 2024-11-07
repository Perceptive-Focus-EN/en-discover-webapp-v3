import { useState, useCallback } from 'react';
import { uploadApi } from '@/lib/api/uploads';
import { 
  FileCategory, 
  UPLOAD_STATUS, 
  UploadStatus,
  UPLOAD_CONFIGS,
  UPLOAD_SETTINGS,
  AccessLevel,
  RetentionType,
  ProcessingStep
} from '@/constants/uploadConstants';

// Base types that match backend exactly
interface BaseMetadata {
  originalName: string;
  mimeType: string;
  uploadedAt: string;
  fileSize: number;
  category: FileCategory;
  accessLevel: AccessLevel;
  retention: RetentionType;
  processingSteps: ProcessingStep[];
}

interface ProcessingMetadata {
  status: UploadStatus;
  completedSteps: ProcessingStep[];
  currentStep?: ProcessingStep;
  error?: string;
}

interface UploadResponse {
  message: string;
  trackingId: string;
  fileUrl: string;
  status: UploadStatus;
  metadata: BaseMetadata;
  processing?: ProcessingMetadata;
}

// Match the API's progress callback signature
interface ProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number;
  remainingTime?: number;
}

type UploadProgressCallback = (progress: ProgressInfo) => void;

interface UseUploadReturn {
  upload: (file: File, category: FileCategory) => Promise<UploadResponse>;
  resumeUpload: (
    file: File,
    trackingId: string,
    lastChunk: number,
    category: FileCategory
  ) => Promise<UploadResponse>;
  progress: number;
  error: string | null;
  isUploading: boolean;
  status: UploadStatus;
  getStatus: typeof uploadApi.getUploadStatus;
  cancel: typeof uploadApi.cancelUpload;
  getHistory: typeof uploadApi.getUploadHistory;
  resetUpload: () => void;
}

export function usePostMedia(): UseUploadReturn {
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>(UPLOAD_STATUS.INITIALIZING);

  const handleProgress = useCallback<UploadProgressCallback>((progressInfo: ProgressInfo) => {
    setProgress(Math.min(progressInfo.percentage, 99)); // Never show 100% until complete
  }, []);

  const validateFileForCategory = useCallback((file: File, category: FileCategory): void => {
    const config = UPLOAD_CONFIGS[category];
    
    if (!config.contentType.includes(file.type) && config.contentType[0] !== '*/*') {
      throw new Error(
        `Invalid file type for category ${category}. Allowed types: ${config.contentType.join(', ')}`
      );
    }

    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      throw new Error(
        `File size exceeds limit for category ${category}. Maximum size: ${maxSizeMB}MB`
      );
    }
  }, []);

  const validateResponse = (response: any): UploadResponse => {
    if (!response.trackingId || !response.fileUrl || !response.metadata) {
      throw new Error('Invalid response format from upload API');
    }
    return response as UploadResponse;
  };

  const upload = useCallback(async (
    file: File, 
    category: FileCategory = UPLOAD_SETTINGS.DEFAULT_CATEGORY
): Promise<UploadResponse> => {
    try {
        setIsUploading(true);
        setError(null);
        setStatus(UPLOAD_STATUS.INITIALIZING);
        validateFileForCategory(file, category);

        // Add timeout promise
        const uploadPromise = uploadApi.uploadFile(file, category);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout')), 30 * 60 * 1000);
        });

        setStatus(UPLOAD_STATUS.PROCESSING);
        const response = await Promise.race([uploadPromise, timeoutPromise]) as UploadResponse;
        
        const validatedResponse = validateResponse(response);
        setStatus(validatedResponse.status);
        setProgress(100);
        return validatedResponse;

    } catch (err) {
        setStatus(UPLOAD_STATUS.ERROR);
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        throw err;
    } finally {
        setIsUploading(false);
    }
  }, [handleProgress, validateFileForCategory]);
  
  const resumeUpload = useCallback(async (
    file: File,
    trackingId: string,
    lastChunk: number,
    category: FileCategory
  ): Promise<UploadResponse> => {
    try {
      setIsUploading(true);
      setError(null);
      setStatus(UPLOAD_STATUS.INITIALIZING);
      validateFileForCategory(file, category);

      // Calculate starting progress based on last chunk
      const initialProgress = Math.min(
        ((lastChunk * UPLOAD_SETTINGS.CHUNK_SIZE) / file.size) * 100,
        99
      );
      setProgress(initialProgress);
      
      setStatus(UPLOAD_STATUS.PROCESSING);
      const response = await uploadApi.resumeUpload(
        file,
        trackingId,
        lastChunk,
        category,
      );

      const validatedResponse = validateResponse(response);
      setStatus(validatedResponse.status);
      setProgress(100);
      return validatedResponse;

    } catch (err) {
      setStatus(UPLOAD_STATUS.ERROR);
      const errorMessage = err instanceof Error ? err.message : 'Resume upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [handleProgress, validateFileForCategory]);

  const resetUpload = useCallback(() => {
    setProgress(0);
    setError(null);
    setIsUploading(false);
    setStatus(UPLOAD_STATUS.INITIALIZING);
  }, []);

  return {
    upload,
    resumeUpload,
    progress,
    error,
    isUploading,
    status,
    getStatus: uploadApi.getUploadStatus,
    cancel: uploadApi.cancelUpload,
    getHistory: uploadApi.getUploadHistory,
    resetUpload
  };
}