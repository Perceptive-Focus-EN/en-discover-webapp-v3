


import { 
    FileCategory, 
    RetentionType, 
    AccessLevel, 
    ProcessingStep,
    UploadStatus 
} from '@/UploadingSystem/constants/uploadConstants';

// Base types that match backend exactly
export interface BaseMetadata {
    originalName: string;
    mimeType: string;
    uploadedAt: string;
    fileSize: number;
    category: FileCategory;
    accessLevel: AccessLevel;
    retention: RetentionType;
    processingSteps: ProcessingStep[];
}

export interface ProcessingMetadata {
    status: UploadStatus;
    completedSteps: ProcessingStep[];
    currentStep?: ProcessingStep;
    error?: string;
}

export interface UploadResponse {
    message: string;
    trackingId: string;
    fileUrl: string;
    status: UploadStatus;
    metadata: BaseMetadata;
    processing?: ProcessingMetadata;
}



// Article-specific response that extends the upload response
export interface ArticleMediaResponse extends Omit<UploadResponse, 'message'> {
    processing: ProcessingMetadata; // Make processing required for articles
}


