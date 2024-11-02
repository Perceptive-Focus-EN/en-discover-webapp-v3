// src/types/Resources/resources.ts
import type { ImageMetadata, ResourceAttachment, ResourceMetadata, ResourceReference } from './metadata';
import type { ResourceInteractions } from './interactions';

export interface Resource {
  id: string;
  title: string;
  abstract: string;
  content: string;
  imageUrl: string;
  readTime: number;
  categories: string[];
  rating: number;
  votes: number;
  author: ResourceAuthor;
  datePublished: string;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  metadata?: ResourceMetadata;
  interactions?: ResourceInteractions;
}

export interface ResourceAuthor {
  id?: string;
  name: string;
  avatar: string;
  bio?: string;
  role?: string;
  credentials?: string[];
}

export type ResourceStatus = 'draft' | 'published' | 'archived' | 'under_review';
export type ResourceVisibility = 'public' | 'private' | 'organization';

export interface ResourceFormMetadata {
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tags: string[];
  references: ResourceReference[];
  attachments: ResourceAttachment[];
  imageMetadata?: ImageMetadata;
  // All fields can be optional in the form
  sourceUrl?: string;
  lastModified?: string;
  version?: number;
}

export interface ResourceFormData {
  title: string;
  abstract: string;
  content: string;
  imageUrl: string;
  categories: string[];
  readTime: number;
  author: ResourceAuthor;
  visibility: ResourceVisibility;
  metadata: ResourceFormMetadata; // Use the form-specific metadata type
}