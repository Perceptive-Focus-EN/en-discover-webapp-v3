// src/features/types/Post.ts
import { UserAccountType } from "@/constants/AccessKey/accounts";
import { EmotionId, EmotionName, PostReaction } from "../../types/Reaction";

// Core Post Types
export type PostType = 'TEXT' | 'PHOTO' | 'VIDEO' | 'MOOD' | 'SURVEY';
export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type Visibility = 'public' | 'private' | 'connections';

// Media Types
export interface Media {
    urls: string[];
    files?: Record<string, { size: number }>;
    thumbnails?: string[];
}

// Core Post Interface
export interface Post {
    id: string;
    userId: string;
    tenantId: string;
    username: [firstName: string, lastName: string];
    userAvatar?: string;
    type: PostType;
    content: PostContent;
    media?: Media;
    reactions?: PostReaction[];
    reactionMetrics?: {
      totalCount: number;
      distribution: Record<EmotionName, number>;
      recentReactions: Array<{
      emotionName: EmotionName;
        user: {
          id: string;
          name: string;
          avatar?: string;
        };
          timestamp: string;
      }>;
    };
    commentCount: number;
    authorId: string;
    timestamp: string;
    accountType: UserAccountType;
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'published' | 'archived' | 'deleted';
    visibility: Visibility;
    isEdited?: boolean;
    lastEditedAt?: string;
    metadata?: {
    shareCount?: number;
    bookmarkCount?: number;
    originalPostId?: string;
    version?: number;
    autoSaveHistory?: {
        version: number;
        timestamp: string;
    }[];
} & Record<string, any>;
}

// Post Content Types
interface BaseContent {
    caption?: string;
    fontSize?: 'small' | 'medium' | 'large';
    alignment?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    padding?: 'small' | 'medium' | 'large'; // For layout consistency
    metadata?: {
        edited?: boolean;
        lastEditedAt?: string;
        originalContent?: string;
    };
}

export interface TextContent extends BaseContent {
    text: string;
    backgroundColor: string;
    textColor: string;
    maxLines?: number; // For text truncation
    isRichText?: boolean; // For rich text editor support
}

export interface VideoContent extends BaseContent {
    videoUrl: string;
    thumbnailUrl?: string;
    duration: string;
    processingStatus?: ProcessingStatus;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    quality?: 'auto' | 'low' | 'medium' | 'high';
}

export interface MoodContent extends BaseContent {
    mood: string;
    color: string;
    intensity?: number; // Scale of emotion intensity
    tags?: string[]; // Associated mood tags
}

export interface SurveyContent extends BaseContent {
    question: string;
    options: { 
        text: string; 
        color?: string;
        count?: number; // Number of votes
        percentage?: number; // Percentage of total votes
    }[];
    allowMultipleChoices?: boolean;
    endDate?: string; // Survey end date
    showResults?: boolean;
    totalVotes?: number;
}

export interface PhotoContent extends BaseContent {
    photos: string[];
    layout?: 'grid' | 'carousel' | 'masonry'; // Display layout
    aspectRatio?: string; // For photo display
    tags?: string[]; // Photo tags
    locations?: { lat: number; lng: number }[]; // Photo locations
}

export type PostContent = 
    | TextContent 
    | PhotoContent 
    | VideoContent 
    | MoodContent 
    | SurveyContent;

// API Types
export interface PostResponse {
    data: Post;
    message?: string;
}


// Update existing types to support drafts
export interface CreatePostDTO {
    type: PostType;
    content: PostContent;
    media?: Media;
    draftId?: string; // Added to link posts to their drafts
}

export interface UpdatePostDTO {
    id: string;
    content?: PostContent;
    media?: Media;
}


// Draft Types
export type DraftStatus = 'draft' | 'published' | 'archived';

export interface Draft extends Omit<Post, 'id' | 'status'> {
    draftId: string;        // Primary ID
    postId?: string;       // If published
    tenantId: string;      // Organization
    status: DraftStatus;
    lastSavedAt: string;   // For revert functionality
    publishedAt?: string;  // If published
    autoSaveVersion: number; // For auto-save tracking
    metadata?: {
        originalPostId?: string;
        version?: number;
        autoSaveHistory?: {
            version: number;
            timestamp: string;
        }[];
    } & Record<string, any>;
}

export interface DraftResponse {
    data: Draft;
    message?: string;
}




// Add this interface for POST request validation
export interface PostDataRequest {
  type: PostType;
  content: PostContent;
  media?: Media;
  visibility?: Visibility;
  draftId?: string;
}
