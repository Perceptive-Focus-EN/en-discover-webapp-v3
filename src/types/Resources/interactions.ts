// src/types/Resources/interactions.ts
import { ResourceAuthor } from './resources';

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
}

export interface ResourceComment {
  id: string;
  content: string;
  author: ResourceAuthor;
  createdAt: string;
  updatedAt?: string;
  replies?: ResourceComment[];
  likes: number;
}

export interface InteractionHistoryItem {
  type: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserInteractionPreferences {
  notifications: boolean;
  displayMode?: 'compact' | 'detailed';
  highlights?: string[];
}
