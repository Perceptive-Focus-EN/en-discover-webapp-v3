import { EmotionId, Reaction, ReactionType } from './Reaction';
import { User } from "../../../types/User/interfaces"; // Assuming 'User' is the correct export
import { TenantInfo } from "../../../types/Tenant/interfaces";
import { UserAccountType } from '@/constants/AccessKey/accounts';

export interface FriendRelationship {
  _id: string;
  userId1: string;
  userId2: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  createdAt: Date;
  updatedAt: Date;
}

// Add these at the top of your file, after the imports

export type PostType = 'MOOD' | 'PHOTO' | 'VIDEO' | 'SURVEY' | 'TEXT';

export type BadgeType = 'ACHIEVEMENT' | 'MILESTONE' | 'REWARD' | 'CUSTOM';

export type PostContent = BadgeContent | TextContent | MoodContent | PhotoContent | SurveyContent | VideoContent;

export interface PostData {
  blobName?: string; // Added blobName property
  postType: PostType;
  content: PostContent;
  userId: string;
  username: string;
  videoUrl?: string;
  userAvatar?: string;
  firstName: string;
  lastName: string;
  type: UserAccountType;
  timestamp: string;
  tenantId: string;
  reactions: Reaction[];
  tenantInfo?: Partial<TenantInfo>;
  reactionCounts: { emotionId: EmotionId; count: number }[];
  processingStatus?: 'queued' | 'processing' | 'completed' | 'failed';

}



export interface BadgeContent {
  badgeName: string;
  badgeImage: string;
  description: string;
  badgeType: BadgeType;
}

// src/components/Feed/types/Post.t


export interface TextContent {
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: 'small' | 'medium' | 'large';
  alignment: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  padding: 'small' | 'medium' | 'large';
  maxLines: number;
}

export type FontSize = 'small' | 'medium' | 'large';
export type TextAlignment = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'bold';
export type Size = 'small' | 'medium' | 'large';


export interface MoodContent {
  mood: string;
  color: string;
}

export interface PhotoContent {
  photos: string[];
  caption?: string;
}

// src/components/Feed/types/Post.ts

export interface SurveyContent {
  question: string;
  options: {
    text: string;
    color?: string;
  }[];
  backgroundColor?: string;
  questionColor?: string;
  optionTextColor?: string;
  showResults?: boolean;
}

export interface VideoContent {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  processingStatus?: 'queued' | 'processing' | 'completed' | 'failed';
  blobName?: string; // Added blobName property
}

export interface FeedPost extends PostData {
  id: string;
  userId: string;
  // username: string;
  avatarUrl: string;
  firstName: string;
  lastName: string;
  accountType: UserAccountType;
  timestamp: string;
  tenantId: string;
  tenantInfo?: Partial<TenantInfo>;
  reactions: Reaction[];
  postType: PostType;
  content: PostContent;
  processingStatus?: 'queued' | 'processing' | 'completed' | 'failed';



  // Common interactions
  onReactionSelect?: (reactionType: ReactionType) => void;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  onUserClick?: () => void;

  // Type-specific interactions
  onContentClick?: () => void;
  onContentClose?: () => void;

  // Media-specific interactions
  onMediaPlay?: () => void;
  onMediaPause?: () => void;
  onMediaEnd?: () => void;
  onFullscreenToggle?: () => void;

  // Survey-specific interactions
  onSurveySubmit?: (option: string) => void;
  onSurveyOptionSelect?: (option: string) => void;

  // Photo-specific interactions
  onPhotoNavigate?: (direction: 'next' | 'prev') => void;
  onPhotoZoom?: (action: 'in' | 'out') => void;
}