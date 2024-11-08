// src/types/ArticleMedia/form.ts
import { 
  FileCategory, 
  RetentionType, 
  AccessLevel, 
  ProcessingStep,
  UploadStatus 
} from '@/UploadingSystem/constants/uploadConstants';
import { BaseMetadata, ProcessingMetadata } from './base';
import { 
  ResourceMetadata,
  ResourceAuthor,
  ResourceStatus,
  ResourceVisibility,
  Resource
} from './resources';

// Form-specific metadata that extends BaseMetadata
export interface FormReference {
  id?: string;
  title: string;
  url: string;
  type: string;
}

export interface FormAttachment {
  id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadStatus?: UploadStatus;
  processing?: ProcessingMetadata;
}

// Form-specific types
export interface ResourceFormData extends Omit<Resource, 'id' | 'rating' | 'votes' | 'status' | 'processing' | 'interactions'> {
  metadata: Omit<Partial<ResourceMetadata>, 'originalName' | 'mimeType' | 'uploadedAt' | 'fileSize' | 'category' | 'accessLevel' | 'retention' | 'processingSteps'> & {
    originalName: string;
    mimeType: string;
    uploadedAt: string;
    fileSize: number;
    category: FileCategory;
    accessLevel: AccessLevel;
    retention: RetentionType;
    processingSteps: ProcessingStep[]
  };
}

// Form submission data that matches backend expectations
export interface ResourceFormSubmission {
  title: string;
  abstract: string;
  content: string;
  imageUrl: string;
  categories: string[];
  readTime: number;
  author: ResourceAuthor;
  visibility: ResourceVisibility;
  metadata: BaseMetadata & {
    readingLevel: string;
    language: string;
    tags: string[];
    references: FormReference[];
    attachments: FormAttachment[];
  };
}

// Form validation
export interface FormValidation {
  field: keyof ResourceFormData;
  rules: ValidationRule[];
  errorMessage?: string;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validate?: (value: any) => boolean;
}

// Form state management
export interface FormState {
  data: ResourceFormData;
  errors: Record<string, string>;
  touched: Set<string>;
  isSubmitting: boolean;
  submitCount: number;
}

// Form actions
export type FormAction = 
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'TOUCH_FIELD'; field: string }
  | { type: 'START_SUBMIT' }
  | { type: 'END_SUBMIT' }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_INITIAL_DATA'; data: Partial<ResourceFormData> };

// Form hooks types
export interface UseResourceForm {
  formState: FormState;
  handleChange: (field: keyof ResourceFormData) => (value: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  setFieldValue: (field: keyof ResourceFormData, value: any) => void;
  setFieldError: (field: keyof ResourceFormData, error: string) => void;
  validateField: (field: keyof ResourceFormData) => boolean;
  isFieldValid: (field: keyof ResourceFormData) => boolean;
  isDirty: boolean;
  isValid: boolean;
}

// Media upload types specific to the form
export interface FormMediaUpload {
  file: File;
  category: FileCategory;
  progress: number;
  status: UploadStatus;
  response?: {
    fileUrl: string;
    trackingId: string;
    metadata: BaseMetadata;
  };
  error?: string;
}

export interface FormMediaState {
  uploads: Map<string, FormMediaUpload>;
  isUploading: boolean;
  totalProgress: number;
}
