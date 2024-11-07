// src/types/ArticleMedia/metadata.ts
import { BaseMetadata, ProcessingMetadata } from './base';

// Core metadata that extends BaseMetadata
export interface ResourceMetadata extends BaseMetadata {
    readingLevel: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    tags: string[];
    references: ResourceReference[];
    attachments: ResourceAttachment[];
    // Optional fields
    sourceUrl?: string;
    lastModified?: string;
    version?: number;
}

export interface ResourceReference {
    id: string;
    title: string;
    url: string;
    type: 'article' | 'book' | 'website' | 'video' | 'other';
    author?: string;
    publishDate?: string;
}

export interface ResourceAttachment extends BaseMetadata {
    id: string;
    name: string;
    url: string;
    size: number;
    uploadDate: string;
    processing?: ProcessingMetadata; // Use existing ProcessingMetadata
    thumbnailUrl?: string;
    previewUrl?: string;
}

// Form-specific metadata
export interface FormMetadata extends Partial<ResourceMetadata> {
    isDraft?: boolean;
    validationErrors?: string[];
}
