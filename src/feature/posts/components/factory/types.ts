// src/features/posts/components/factory/types.ts
import { 
  Post, 
  PostContent, 
  TextContent, 
  PhotoContent, 
  VideoContent,
  MoodContent,
  SurveyContent,
  PostType, 
  Visibility
} from '../../api/types';

export interface TextCardProps extends BaseCardProps {
  type: 'TEXT';
  content: TextContent;
}

export interface PhotoCardProps extends BaseCardProps {
  type: 'PHOTO';
  content: PhotoContent;
  media?: Post['media'];
}

export interface VideoCardProps extends BaseCardProps {
  type: 'VIDEO';
  content: VideoContent;
  media?: Post['media'];
}

export interface MoodCardProps extends BaseCardProps {
  type: 'MOOD';
  content: MoodContent;
}

export interface SurveyCardProps extends BaseCardProps {
  type: 'SURVEY';
  content: SurveyContent;
}

// src/features/posts/components/factory/types.ts
export interface BaseCardProps {
  id: string;
  authorId: string;
  username: [firstName: string, lastName: string];
  userAvatar?: string;
  createdAt: string;
  updatedAt: string;
  visibility: Visibility;
  metadata?: Record<string, any>;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

