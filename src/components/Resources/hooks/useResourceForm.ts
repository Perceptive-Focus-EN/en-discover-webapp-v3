// src/components/Resources/hooks/useResourceForm.ts
import { useState, useCallback } from 'react';
import { resourcesApi } from '../api/resourcesApi';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import {
  Resource,
  ResourceFormData,
  ResourceFormState,
  ResourceFormHookReturn,
  ResourceActionResult,
  ResourceVisibility
} from '../../../types/ArticleMedia';

const initialState: ResourceFormState = {
  title: '',
  abstract: '',
  content: '',
  imageUrl: '',
  categories: [],
  readTime: 5,
  author: {
    name: '',
    avatar: '',
    bio: '',
    role: '',
    credentials: []
  },
  visibility: 'public' as ResourceVisibility,
  metadata: {},
  errors: {},
  touched: {},
  isDirty: false
};

export const useResourceForm = (
  initialData?: Partial<ResourceFormData>
): ResourceFormHookReturn => {
  const [formState, setFormState] = useState<ResourceFormState>({
    ...initialState,
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields validation
    if (!formState.title.trim()) errors.title = 'Title is required';
    if (!formState.abstract.trim()) errors.abstract = 'Abstract is required';
    if (!formState.content.trim()) errors.content = 'Content is required';
    if (!formState.categories.length) errors.categories = 'At least one category is required';
    if (!formState.author.name.trim()) errors.authorName = 'Author name is required';

    // Content length validation
    if (formState.title.length > 100) errors.title = 'Title must be less than 100 characters';
    if (formState.abstract.length > 500) errors.abstract = 'Abstract must be less than 500 characters';
    
    // Categories validation
    if (formState.categories.length > 5) errors.categories = 'Maximum 5 categories allowed';

    // Read time validation
    if (formState.readTime < 1 || formState.readTime > 60) {
      errors.readTime = 'Read time must be between 1 and 60 minutes';
    }

    setFormState(prev => ({
      ...prev,
      errors,
      isDirty: true
    }));

    return Object.keys(errors).length === 0;
  }, [formState]);

  const handleChange = useCallback((
    field: keyof ResourceFormData,
    value: any
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      touched: {
        ...prev.touched,
        [field]: true
      },
      errors: {
        ...prev.errors,
        [field]: ''
      },
      isDirty: true
    }));
  }, []);

  const handleBlur = useCallback((field: keyof ResourceFormData) => {
    setFormState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: true
      }
    }));
  }, []);

  const setFieldError = useCallback((
    field: keyof ResourceFormData,
    error: string
  ) => {
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error
      }
    }));
  }, []);

  const handleSubmit = useCallback(async (): Promise<ResourceActionResult<Resource>> => {
    if (!validateForm()) {
      return {
        success: false,
        error: 'Please fix the form errors before submitting',
        message: 'Validation failed'
      };
    }

    setLoading(true);
    try {
      const { errors, touched, isDirty, ...submitData } = formState;
      const result: Resource = await resourcesApi.createResource(submitData) as unknown as Resource;
      
      messageHandler.success('Resource created successfully');
      
      setFormState(prev => ({
        ...prev,
        isDirty: false
      }));

      return {
        success: true,
        data: result,
        message: 'Resource created successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save resource';
      messageHandler.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to save resource'
      };
    } finally {
      setLoading(false);
    }
  }, [formState, validateForm]);

  const resetForm = useCallback(() => {
    setFormState(initialState);
  }, []);

  return {
    formState,
    loading,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateForm,
    setFieldError
  };
};

export default useResourceForm;