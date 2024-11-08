// src/features/posts/hooks/usePostForm.ts

import { useState, useCallback, useEffect } from 'react';
import { usePost } from './usePost';
import { useAuth } from '@/contexts/AuthContext';
import { usePostMedia } from './usePostMedia';
import { PostContent, PostType, CreatePostDTO, Media } from '../api/types';
import { draftApi } from '../api/draftApi';
import { 
  UPLOAD_STATUS, 
  UPLOAD_CONFIGS,
  ProcessingStep,
  UploadStatus 
} from '@/UploadingSystem/constants/uploadConstants';
import { FileCategory} from '@/UploadingSystem/constants/uploadConstants';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { UploadSuccessResponse} from '@/UploadingSystem/types/upload';
import { UploadProgress } from '@/UploadingSystem/types/progress';

interface PostFormState {
  type: PostType;
  content: PostContent;
  media?: Media;
  visibility: 'public' | 'private' | 'connections';
  draftId?: string;
  processingStatus?: ProcessingStep;
}

interface MediaUploadState {
  file: File | null;
  category: FileCategory | null;
  trackingId: string | null;
  progress: UploadProgress | null;
}

const createInitialContent = (type: PostType): PostContent => {
  switch (type) {
  case PostType.TEXT:
    return {
    text: '',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    fontSize: 'medium',
    alignment: 'left',
    fontWeight: 'normal',
    };
  case PostType.PHOTO:
    return {
    photos: [],
    caption: '',
    };
  case PostType.VIDEO:
    return {
    videoUrl: '',
    duration: '0:00',
    caption: '',
    };
  case PostType.MOOD:
    return {
    mood: '',
    color: '',
    caption: '',
    };
  case PostType.SURVEY:
    return {
    question: '',
    options: [],
    caption: '',
    };
  default:
    throw new Error(`Unsupported post type: ${type}`);
  }
};

// Validation functions
const validateFileForCategory = (file: File, category: FileCategory): string | null => {
  const config = UPLOAD_CONFIGS[category];
  
  if (!config.contentType.includes(file.type) && !config.contentType.includes('*/*')) {
    return `Invalid file type. Allowed types: ${config.contentType.join(', ')}`;
  }

  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return `File size exceeds ${maxSizeMB}MB limit`;
  }

  return null;
};

const determineFileCategory = (file: File): FileCategory => {
  if (file.type.startsWith('video/')) return FileCategory.VIDEO;
  if (file.type.startsWith('image/')) return FileCategory.IMAGE;
  return FileCategory.OTHER;
};

export const usePostForm = (initialData?: Partial<PostFormState>) => {
  const { user } = useAuth();
  const { createPost } = usePost();
  const { 
  upload: uploadMedia, 
  resumeUpload,
  cancelUpload,
  retryUpload,
  resetUpload,
  progress,
  uploadStatus,
  processingStatus,
  error: uploadError,
  isUploading,
  isProcessing,
  currentChunk,
  totalChunks,
  speed,
  remainingTime
  } = usePostMedia();

  const initialState: PostFormState = {
  type: PostType.TEXT,
  content: createInitialContent(PostType.TEXT),
  visibility: 'public',
  };
  
  const [formState, setFormState] = useState<PostFormState>({
  ...initialState,
  ...initialData,
  });

  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(!!initialData?.draftId);
  const [mediaState, setMediaState] = useState<MediaUploadState>({
  file: null,
  category: null,
  trackingId: null,
  progress: null
  });

  const handleMediaUpload = useCallback(async (file: File) => {
  try {
    const category = determineFileCategory(file);
    const validationError = validateFileForCategory(file, category);
    
    if (validationError) {
    throw new Error(validationError);
    }

    // Cleanup previous upload if exists
    if (mediaState.trackingId) {
    await cancelUpload(mediaState.trackingId);
    }

    setMediaState(prev => ({
    ...prev,
    file,
    category,
    progress: null
    }));

    const response = await uploadMedia(file, category);
    
    setMediaState(prev => ({
    ...prev,
    trackingId: response.trackingId,
    progress: {
      trackingId: response.trackingId,
      progress: 0,
      chunksCompleted: 0,
      totalChunks: 0, // Add this line
      uploadedBytes: 0,
      totalBytes: file.size,
      status: response.status,
      userId: user?.userId ?? '' // Add userId here
    }
    }));

    setFormState(prev => ({
    ...prev,
    type: category === FileCategory.VIDEO ? PostType.VIDEO : PostType.PHOTO,
    media: {
      urls: [response.fileUrl],
      thumbnails: [],
      category,
      processingStatus: response.processing?.currentStep,
      trackingId: response.trackingId,
      metadata: {
      ...response.metadata,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size
      }
    }
    }));

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upload media';
    setError(message);
    messageHandler.error(message);
    
    // Reset media state on error
    setMediaState({
    file: null,
    category: null,
    trackingId: null,
    progress: null
    });
    
    throw err;
  }
  }, [uploadMedia, mediaState.trackingId, cancelUpload]);

  const handleMediaRetry = useCallback(async () => {
  if (!mediaState.file || !mediaState.category || !mediaState.trackingId) {
    messageHandler.error('No upload data available for retry');
    return;
  }

  try {
    const response = await retryUpload();
    if (response) {
    setFormState(prev => ({
      ...prev,
      media: {
      ...prev.media!,
      urls: [response.fileUrl],
      processingStatus: response.processing?.currentStep,
        metadata: {
          ...response.metadata,
        originalName: mediaState.file!.name,
        mimeType: mediaState.file!.type,
        fileSize: mediaState.file!.size
      }
      }
    }));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to retry media upload';
    setError(message);
    messageHandler.error(message);
  }
  }, [mediaState, retryUpload]);

  const handleMediaCancel = useCallback(async () => {
  if (!mediaState.trackingId) return;

  try {
    await cancelUpload(mediaState.trackingId);
    setFormState(prev => ({ ...prev, media: undefined }));
    setMediaState({
    file: null,
    category: null,
    trackingId: null,
    progress: null
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel media upload';
    setError(message);
    messageHandler.error(message);
  }
  }, [mediaState.trackingId, cancelUpload]);

  const updateContent = useCallback(<K extends keyof PostContent>(
  field: K,
  value: PostContent[K]
  ) => {
  setFormState(prev => ({
    ...prev,
    content: { ...prev.content, [field]: value },
  }));
  }, []);

  const saveDraft = useCallback(async () => {
  if (!user) throw new Error('User must be authenticated to save draft');

  try {
    const draftData: CreatePostDTO = {
    type: formState.type,
    content: formState.content,
    media: formState.media,
    draftId: formState.draftId,
    };

    const savedDraft = await draftApi.save(draftData);
    setFormState(prev => ({ ...prev, draftId: savedDraft.draftId }));
    setIsDraft(true);
    return savedDraft;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save draft';
    setError(message);
    throw err;
  }
  }, [formState, user]);

  const submitPost = useCallback(async () => {
  if (!user) throw new Error('User must be authenticated to create post');
  
  // Don't allow submission while media is uploading or processing
  if (isUploading || isProcessing) {
    throw new Error('Please wait for media upload to complete');
  }

  try {
    const postData: CreatePostDTO = {
    type: formState.type,
    content: formState.content,
    media: formState.media,
    draftId: formState.draftId,
    };

    const post = await createPost(postData);

    // If this was a draft, mark it as published
    if (isDraft && formState.draftId) {
    await draftApi.publish(formState.draftId);
    }

    resetForm();
    return post;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create post';
    setError(message);
    throw err;
  }
  }, [formState, user, createPost, isDraft, isUploading, isProcessing]);

  const resetForm = useCallback(() => {
  setFormState(initialState);
  setIsDraft(false);
  setError(null);
  setMediaState({
    file: null,
    category: null,
    trackingId: null,
    progress: null
  });
  resetUpload();
  }, [resetUpload]);

  // Cleanup on unmount
  useEffect(() => {
  return () => {
    if (mediaState.trackingId) {
    cancelUpload(mediaState.trackingId).catch(console.error);
    }
  };
  }, [mediaState.trackingId, cancelUpload]);

  // Update progress when upload status changes
  useEffect(() => {
  if (mediaState.trackingId && (uploadStatus || processingStatus)) {
    setMediaState(prev => ({
    ...prev,
    progress: prev.progress ? {
      ...prev.progress,
      status: uploadStatus,
      progress: progress,
      chunksCompleted: currentChunk || 0,
    } : null
    }));
  }
  }, [uploadStatus, processingStatus, progress, currentChunk, mediaState.trackingId]);

  return {
  formState,
  updateContent,
  handleMediaUpload,
  handleMediaRetry,
  handleMediaCancel,
  isUploading,
  isProcessing,
  error: error || uploadError,
  isDraft,
  submitPost,
  saveDraft,
  resetForm,
  
  // Media upload progress
  uploadProgress: progress,
  uploadStatus,
  processingStatus,
  currentChunk,
  totalChunks,
  uploadSpeed: speed,
  remainingTime,

  // Media state
  mediaState: {
    file: mediaState.file,
    category: mediaState.category,
    progress: mediaState.progress,
    isUploading,
    isProcessing,
    canRetry: mediaState.trackingId !== null && uploadStatus === UPLOAD_STATUS.FAILED
  }
  };
};