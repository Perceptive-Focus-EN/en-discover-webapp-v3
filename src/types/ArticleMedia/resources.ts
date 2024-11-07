import { BaseMetadata, ProcessingMetadata } from './base';
import { ResourceInteractions } from './interactions';
import { ResourceFormData } from './form';
import { ResourceFilters, ResourceSortOptions } from './filters';
import { ResourceAttachment, ResourceReference } from './metadata';

// Core resource types that aren't form-specific
export interface ResourceMetadata extends BaseMetadata {
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    tags?: string[];
    references?: ResourceReference[];
    attachments?: ResourceAttachment[];
    sourceUrl?: string;
    lastModified?: string;
    version?: number;
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

// Main Resource interface
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
    metadata: ResourceMetadata;
    processing?: ProcessingMetadata;
    interactions: ResourceInteractions;
}

