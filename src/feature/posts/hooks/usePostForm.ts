// src/features/posts/hooks/usePostForm.ts
import { useState, useCallback } from 'react';
import { usePost } from './usePost';
import { useAuth } from '@/contexts/AuthContext';
import { usePostMedia } from './usePostMedia';
import { uploadApi } from '../api/uploadApi';
import { draftApi } from '../api/draftApi';
import { PostContent, PostType, CreatePostDTO, Media } from '../api/types';

interface PostFormState {
  type: PostType;
  content: PostContent;
  media?: Media;
  visibility: 'public' | 'private' | 'connections';
  draftId?: string;
}

const createInitialContent = (type: PostType): PostContent => {
  switch (type) {
    case 'TEXT':
      return {
        text: '',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        fontSize: 'medium',
        alignment: 'left',
        fontWeight: 'normal',
      };
    case 'PHOTO':
      return {
        photos: [],
        caption: '',
      };
    case 'VIDEO':
      return {
        videoUrl: '',
        duration: '0:00',
        caption: '',
      };
    case 'MOOD':
      return {
        mood: '',
        color: '',
        caption: '',
      };
    case 'SURVEY':
      return {
        question: '',
        options: [],
        caption: '',
      };
    default:
      throw new Error(`Unsupported post type: ${type}`);
  }
};

const initialState: PostFormState = {
  type: 'TEXT',
  content: createInitialContent('TEXT'),
  visibility: 'public',
};

export const usePostForm = (initialData?: Partial<PostFormState>) => {
  const { user } = useAuth();
  const { createPost } = usePost();
  const { uploadMultiple, isUploading: isMediaUploading, progress } = usePostMedia();

  const [formState, setFormState] = useState<PostFormState>({
    ...initialState,
    ...initialData,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(!!initialData?.draftId);

  const updateContent = useCallback(<K extends keyof PostContent>(
    field: K,
    value: PostContent[K]
  ) => {
    setFormState((prev) => ({
      ...prev,
      content: { ...prev.content, [field]: value },
    }));
  }, []);

  const handleMediaUpload = useCallback(async (files: FileList): Promise<Media> => {
    const uploads = await uploadMultiple(Array.from(files));

    return {
      urls: uploads.map((u) => u.url),
      thumbnails: uploads.map((u) => u.thumbnail).filter((thumbnail): thumbnail is string => Boolean(thumbnail)),
      files: Object.fromEntries(
        uploads.map((u, i) => [files[i].name, { size: files[i].size }])
      ),
    };
  }, [uploadMultiple]);

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
      setFormState((prev) => ({ ...prev, draftId: savedDraft.draftId }));
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

    setIsUploading(true);
    setError(null);

    try {
      const postData: CreatePostDTO = {
        type: formState.type,
        content: formState.content,
        media: formState.media,
        draftId: formState.draftId,
      };

      await createPost(postData);

      // If this was a draft, mark it as published
      if (isDraft && formState.draftId) {
        await draftApi.publish(formState.draftId);
      }

      setFormState(initialState);
      setIsDraft(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [formState, user, createPost, isDraft]);

  return {
    formState,
    updateContent,
    handleMediaUpload,
    isUploading: isUploading || isMediaUploading,
    error,
    isDraft,
    submitPost,
    saveDraft,
    resetForm: () => setFormState(initialState),
    uploadProgress: progress,
  };
};
