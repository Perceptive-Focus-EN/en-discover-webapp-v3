// src/components/Feed/types/PostCreator.ts

import { PostType, PostContent, PostData } from './Post';
import { ImageListType } from 'react-images-uploading';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';

export interface PostCreatorProps {
  onPostCreated?: (newPost: PostData) => Promise<void>;
}

export interface PostCreatorState {
  expanded: PostType | false;
  postType: PostType;
  content: string;
  backgroundColor: string;
  mood: string;
  moodColor: string;
  file: File | null;
  textColor: string;
  fontSize: 'small' | 'medium' | 'large';
  alignment: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  padding: 'small' | 'medium' | 'large';
  surveyBackgroundColor: string;
  surveyQuestionColor: string;
  surveyOptionTextColor: string;
  surveyOptions: string[];
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  mediaUrl: string;
  videoProcessingStatus: 'queued' | 'processing' | 'completed' | 'failed';
  images: ImageListType;
  videoUrl: string | null;
  loading: boolean;
  error: string | null;
}

export interface PostCreatorActions {
  setExpanded: (expanded: PostType | false) => void;
  setPostType: (postType: PostType) => void;
  setContent: (content: string) => void;
  setBackgroundColor: (color: string) => void;
  setMood: (mood: string) => void;
  setMoodColor: (color: string) => void;
  setFile: (file: File | null) => void;
  setTextColor: (color: string) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setAlignment: (alignment: 'left' | 'center' | 'right') => void;
  setFontWeight: (weight: 'normal' | 'bold') => void;
  setPadding: (padding: 'small' | 'medium' | 'large') => void;
  setSurveyBackgroundColor: (color: string) => void;
  setSurveyQuestionColor: (color: string) => void;
  setSurveyOptionTextColor: (color: string) => void;
  setSurveyOptions: (options: string[]) => void;
  setAutoplay: (autoplay: boolean) => void;
  setMuted: (muted: boolean) => void;
  setLoop: (loop: boolean) => void;
  setMediaUrl: (url: string) => void;
  setVideoProcessingStatus: (status: 'queued' | 'processing' | 'completed' | 'failed') => void;
  setImages: (images: ImageListType) => void;
  setVideoUrl: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface PostCreatorHandlers {
  handleChange: (panel: PostType) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleContentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

export interface PostCreatorHelpers {
  getVideoDuration: (file: File) => Promise<number>;
  preparePostContent: () => Promise<PostContent | null>;
}

export interface PostCreatorContextValue extends PostCreatorState, PostCreatorActions, PostCreatorHandlers, PostCreatorHelpers {}

export interface PostCreatorProviderProps {
  children: React.ReactNode;
}