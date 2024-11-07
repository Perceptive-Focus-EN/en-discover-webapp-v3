// src/types/ArticleMedia/index.ts
import type { Resource, ResourceAuthor, ResourceStatus, ResourceVisibility } from './resources';
import type { ProcessingMetadata, BaseMetadata } from './base';

// Type guards
export const isResourceAuthor = (value: any): value is ResourceAuthor => {
    return (
        value &&
        typeof value.name === 'string' &&
        typeof value.avatar === 'string' &&
        (!value.bio || typeof value.bio === 'string') &&
        (!value.role || typeof value.role === 'string') &&
        (!value.credentials || Array.isArray(value.credentials))
    );
};

export const isProcessingMetadata = (value: any): value is ProcessingMetadata => {
    return (
        value &&
        typeof value.status === 'string' &&
        Array.isArray(value.completedSteps) &&
        (!value.currentStep || typeof value.currentStep === 'string') &&
        (!value.error || typeof value.error === 'string')
    );
};

export const isBaseMetadata = (value: any): value is BaseMetadata => {
    return (
        value &&
        typeof value.originalName === 'string' &&
        typeof value.mimeType === 'string' &&
        typeof value.uploadedAt === 'string' &&
        typeof value.fileSize === 'number' &&
        typeof value.category === 'string' &&
        typeof value.accessLevel === 'string' &&
        typeof value.retention === 'string' &&
        Array.isArray(value.processingSteps)
    );
};

export const isResource = (value: any): value is Resource => {
    return (
        value &&
        typeof value.id === 'string' &&
        typeof value.title === 'string' &&
        typeof value.abstract === 'string' &&
        typeof value.content === 'string' &&
        typeof value.imageUrl === 'string' &&
        Array.isArray(value.categories) &&
        typeof value.readTime === 'number' &&
        typeof value.rating === 'number' &&
        typeof value.votes === 'number' &&
        isResourceAuthor(value.author) &&
        typeof value.datePublished === 'string' &&
        isValidResourceStatus(value.status) &&
        isValidResourceVisibility(value.visibility) &&
        isBaseMetadata(value.metadata) &&
        (!value.processing || isProcessingMetadata(value.processing))
    );
};

// Validation helpers
export const isValidResourceStatus = (value: any): value is ResourceStatus => {
    return ['draft', 'published', 'archived', 'under_review'].includes(value);
};

export const isValidResourceVisibility = (value: any): value is ResourceVisibility => {
    return ['public', 'private', 'organization'].includes(value);
};

// Utility for validating upload responses
export const isValidUploadResponse = (value: any): boolean => {
    return (
        value &&
        typeof value.trackingId === 'string' &&
        typeof value.fileUrl === 'string' &&
        typeof value.status === 'string' &&
        isBaseMetadata(value.metadata) &&
        (!value.processing || isProcessingMetadata(value.processing))
    );
};

// Error types for better error handling
export class ResourceValidationError extends Error {
    constructor(message: string, public details: Record<string, any>) {
        super(message);
        this.name = 'ResourceValidationError';
    }
}

// Validation function with detailed errors
export const validateResource = (resource: any): resource is Resource => {
    const errors: string[] = [];

    if (!resource.id) errors.push('Missing id');
    if (!resource.title) errors.push('Missing title');
    if (!resource.abstract) errors.push('Missing abstract');
    if (!resource.content) errors.push('Missing content');
    if (!resource.imageUrl) errors.push('Missing imageUrl');
    if (!Array.isArray(resource.categories)) errors.push('Invalid categories');
    if (typeof resource.readTime !== 'number') errors.push('Invalid readTime');
    if (!isResourceAuthor(resource.author)) errors.push('Invalid author');
    if (!isValidResourceStatus(resource.status)) errors.push('Invalid status');
    if (!isValidResourceVisibility(resource.visibility)) errors.push('Invalid visibility');
    if (!isBaseMetadata(resource.metadata)) errors.push('Invalid metadata');

    if (errors.length > 0) {
        throw new ResourceValidationError('Resource validation failed', { errors });
    }

    return true;
};

// Export everything else
export * from './actions';
export * from './base';
export * from './config';
export * from './filters';
export * from './form';
export * from './interactions';
export * from './list';
export * from './metadata';
export * from './permissions';
export type {
  Resource,
  ResourceAuthor,
  ResourceStatus,
  ResourceVisibility
} from './resources';

// Re-export constants
export {
  UPLOAD_STATUS,
  UPLOAD_CONFIGS,
  UPLOAD_SETTINGS,
  UPLOAD_PATHS,
  COSMOS_COLLECTIONS
} from '@/constants/uploadConstants';

export type {
  FileCategory,
  RetentionType,
  AccessLevel,
  ProcessingStep,
  UploadStatus
} from '@/constants/uploadConstants';
