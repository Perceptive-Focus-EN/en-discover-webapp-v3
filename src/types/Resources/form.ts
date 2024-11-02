// src/features/resources/types/form.ts
import { Resource } from './resources';
import { ResourceActionResult } from './actions';
import { ResourceFormData } from './resources';
import { ResourceAttachment, ResourceReference } from './metadata';


export interface FormState extends ResourceFormData {
  metadata: {
    readingLevel: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    tags: string[];
    references: ResourceReference[];
    attachments: ResourceAttachment[];
    imageMetadata?: {
      originalName: string;
      mimeType: string;
      uploadedAt: string;
    };
  };
}

export interface ResourceFormHookReturn {
  formState: FormState;
  loading: boolean;
  handleChange: (field: keyof ResourceFormData, value: any) => void;
  handleBlur: (field: keyof ResourceFormData) => void;
  handleSubmit: () => Promise<ResourceActionResult<Resource>>;
  resetForm: () => void;
  validateForm: () => boolean;
  setFieldError: (field: keyof ResourceFormData, error: string) => void;
}