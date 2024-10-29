// src/components/Feed/types/PostCreator.ts

import { PostType, PostContent, BasePost} from './Post';
import { ImageListType } from 'react-images-uploading';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { Reaction } from './Reaction';


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

