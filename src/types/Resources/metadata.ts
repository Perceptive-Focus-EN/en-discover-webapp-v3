// src/types/Resources/metadata.ts
export interface ResourceMetadata {
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tags: string[];
  references: ResourceReference[];
  attachments: ResourceAttachment[];
  // Optional fields
  sourceUrl?: string;
  imageMetadata?: ImageMetadata;
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

export interface ResourceAttachment {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document';
  size: number;
  uploadDate: string;
}

export interface ImageMetadata {
  originalName: string;
  mimeType: string;
  uploadedAt: string;
}
