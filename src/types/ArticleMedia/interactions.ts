// src/types/ArticleMedia/interactions.ts
import { ResourceAuthor } from './resources';
import { ProcessingStep, UploadStatus } from '@/UploadingSystem/constants/uploadConstants';

// Base interaction types
export interface BaseInteraction {
    userId: string;
    timestamp: string;
    type: InteractionType;
    metadata?: Record<string, any>;
}

export type InteractionType = 
    | 'view'
    | 'bookmark'
    | 'rate'
    | 'comment'
    | 'share'
    | 'download'
    | 'process_complete'
    | 'upload_complete';

// Main interactions interface
export interface ResourceInteractions {
    isBookmarked: boolean;
    userRating?: number;
    viewCount: number;
    shareCount: number;
    bookmarkCount: number;
    comments?: ResourceComment[];
    lastInteraction?: string;
    interactionHistory?: InteractionHistoryItem[];
    userPreferences?: UserInteractionPreferences;
    // New fields for media-specific interactions
    mediaInteractions?: {
        downloads: number;
        processingViews: number;
        uploadRetries: number;
        lastProcessingStep?: ProcessingStep;
        processingStatus?: UploadStatus;
    };
}

export interface ResourceComment extends BaseInteraction {
    id: string;
    content: string;
    author: ResourceAuthor;
    createdAt: string;
    updatedAt?: string;
    replies?: ResourceComment[];
    likes: number;
    // Media-specific comment fields
    attachments?: {
        type: 'image' | 'video' | 'document';
        url: string;
        thumbnailUrl?: string;
        processingStatus?: UploadStatus;
    }[];
}

export interface InteractionHistoryItem extends BaseInteraction {
    metadata?: {
        previousState?: string;
        newState?: string;
        processingStep?: ProcessingStep;
        uploadProgress?: number;
        error?: string;
    };
}

export interface UserInteractionPreferences {
    notifications: boolean;
    displayMode?: 'compact' | 'detailed';
    highlights?: string[];
    mediaPreferences?: {
        autoPlay: boolean;
        defaultQuality: 'auto' | 'high' | 'medium' | 'low';
        downloadOriginal: boolean;
        processingNotifications: boolean;
    };
}

// Interaction events for real-time updates
export interface InteractionEvent {
    type: InteractionType;
    resourceId: string;
    userId: string;
    timestamp: string;
    data: {
        action: string;
        value?: any;
        processingStatus?: UploadStatus;
        processingStep?: ProcessingStep;
    };
}

// Analytics types for tracking interactions
export interface InteractionAnalytics {
    resourceId: string;
    totalInteractions: number;
    uniqueUsers: number;
    interactionBreakdown: {
        [K in InteractionType]: number;
    };
    processingMetrics?: {
        averageProcessingTime: number;
        processingSuccessRate: number;
        commonErrors: Array<{
            type: string;
            count: number;
        }>;
    };
}