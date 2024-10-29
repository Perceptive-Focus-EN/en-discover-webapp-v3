// src/features/posts/utils/validation.ts

import { ImageListType } from 'react-images-uploading';
import { PostCreatorState, PostType, PostContent } from '../types';
import { ValidationError } from '@/MonitoringSystem/errors/specific';

interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

type ValidationRules = {
  [K in keyof PostCreatorState]?: ValidationRule[];
};

// File size constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_DURATION = 300; // 5 minutes in seconds

// Content length limits
const MAX_TEXT_LENGTH = 5000;
const MAX_MOOD_LENGTH = 200;
const MAX_SURVEY_QUESTION_LENGTH = 500;
const MAX_SURVEY_OPTION_LENGTH = 100;
const MIN_SURVEY_OPTIONS = 2;
const MAX_SURVEY_OPTIONS = 10;
const MAX_PHOTO_COUNT = 10;

export const validationRules: ValidationRules = {
  // Common validations
  content: [
    {
      validate: (value: string) => typeof value === 'string' && value.trim().length > 0,
      message: 'Content cannot be empty',
    },
    {
      validate: (value: string) => value.length <= MAX_TEXT_LENGTH,
      message: `Content cannot exceed ${MAX_TEXT_LENGTH} characters`,
    },
  ],

  // Text post validations
  backgroundColor: [
    {
      validate: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
      message: 'Invalid background color format',
    },
  ],
  textColor: [
    {
      validate: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
      message: 'Invalid text color format',
    },
  ],
  fontSize: [
    {
      validate: (value: string) => ['small', 'medium', 'large'].includes(value),
      message: 'Invalid font size',
    },
  ],
  alignment: [
    {
      validate: (value: string) => ['left', 'center', 'right'].includes(value),
      message: 'Invalid text alignment',
    },
  ],
  fontWeight: [
    {
      validate: (value: string) => ['normal', 'bold'].includes(value),
      message: 'Invalid font weight',
    },
  ],
  padding: [
    {
      validate: (value: string) => ['small', 'medium', 'large'].includes(value),
      message: 'Invalid padding size',
    },
  ],

  // Mood post validations
  mood: [
    {
      validate: (value: string) => value.trim().length > 0,
      message: 'Mood cannot be empty',
    },
    {
      validate: (value: string) => value.length <= MAX_MOOD_LENGTH,
      message: `Mood description cannot exceed ${MAX_MOOD_LENGTH} characters`,
    },
  ],
  moodColor: [
    {
      validate: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
      message: 'Invalid mood color format',
    },
  ],

  // Survey post validations
  surveyOptions: [
    {
      validate: (value: string[]) => value.length >= MIN_SURVEY_OPTIONS,
      message: `Survey must have at least ${MIN_SURVEY_OPTIONS} options`,
    },
    {
      validate: (value: string[]) => value.length <= MAX_SURVEY_OPTIONS,
      message: `Survey cannot have more than ${MAX_SURVEY_OPTIONS} options`,
    },
    {
      validate: (value: string[]) => value.every(option => option.trim().length > 0),
      message: 'Survey options cannot be empty',
    },
    {
      validate: (value: string[]) => value.every(option => option.length <= MAX_SURVEY_OPTION_LENGTH),
      message: `Survey options cannot exceed ${MAX_SURVEY_OPTION_LENGTH} characters`,
    },
  ],
  surveyBackgroundColor: [
    {
      validate: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
      message: 'Invalid survey background color format',
    },
  ],
  surveyQuestionColor: [
    {
      validate: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
      message: 'Invalid survey question color format',
    },
  ],
  surveyOptionTextColor: [
    {
      validate: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
      message: 'Invalid survey option text color format',
    },
  ],

  // Photo post validations
  images: [
    {
      validate: (value: ImageListType) => value.length > 0,
      message: 'At least one photo is required',
    },
    {
      validate: (value: ImageListType) => value.length <= MAX_PHOTO_COUNT,
      message: `Cannot upload more than ${MAX_PHOTO_COUNT} photos`,
    },
    {
      validate: (value: ImageListType) =>
        value.every(img => (img.file ? img.file.size <= MAX_IMAGE_SIZE : true)),
      message: `Each photo must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
    },
  ],

  // Video post validations
  file: [
    {
      validate: (value: File | null) => !value || value.size <= MAX_FILE_SIZE,
      message: `Video file must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    },
  ],
  videoUrl: [
    {
      validate: (value: string | null) => !value || /^https?:\/\/.+/.test(value),
      message: 'Invalid video URL format',
    },
  ],
  autoplay: [
    {
      validate: (value: boolean) => typeof value === 'boolean',
      message: 'Invalid autoplay setting',
    },
  ],
  muted: [
    {
      validate: (value: boolean) => typeof value === 'boolean',
      message: 'Invalid muted setting',
    },
  ],
  loop: [
    {
      validate: (value: boolean) => typeof value === 'boolean',
      message: 'Invalid loop setting',
    },
  ],
};

// Validation function implementations
export const validateField = (field: keyof PostCreatorState, value: any): ValidationError[] => {
  const rules = validationRules[field];
  if (!rules) return [];

  const errors: ValidationError[] = [];
  rules.forEach(rule => {
    if (!rule.validate(value)) {
      errors.push({ field, message: rule.message });
    }
  });

  return errors;
};

export const validateAllFields = (state: PostCreatorState): ValidationError[] => {
  let errors: ValidationError[] = [];

  // Validate common fields first
  errors = errors.concat(validateField('content', state.content));

  // Validate type-specific fields
  switch (state.postType) {
    case 'TEXT':
      errors = errors.concat([
        ...validateField('backgroundColor', state.backgroundColor),
        ...validateField('textColor', state.textColor),
        ...validateField('fontSize', state.fontSize),
        ...validateField('alignment', state.alignment),
        ...validateField('fontWeight', state.fontWeight),
        ...validateField('padding', state.padding),
      ]);
      break;

    case 'MOOD':
      errors = errors.concat([
        ...validateField('mood', state.mood),
        ...validateField('moodColor', state.moodColor),
      ]);
      break;

    case 'SURVEY':
      errors = errors.concat([
        ...validateField('surveyOptions', state.surveyOptions),
        ...validateField('surveyBackgroundColor', state.surveyBackgroundColor),
        ...validateField('surveyQuestionColor', state.surveyQuestionColor),
        ...validateField('surveyOptionTextColor', state.surveyOptionTextColor),
      ]);
      break;

    case 'PHOTO':
      errors = errors.concat(validateField('images', state.images));
      break;

    case 'VIDEO':
      errors = errors.concat([
        ...validateField('file', state.file),
        ...validateField('videoUrl', state.videoUrl),
        ...validateField('autoplay', state.autoplay),
        ...validateField('muted', state.muted),
        ...validateField('loop', state.loop),
      ]);
      break;
  }

  return errors;
};

export const validatePostContent = async (
  content: PostContent,
  postType: PostType
): Promise<ValidationError[]> => {
  const errors: ValidationError[] = [];

  // Additional content-specific validations
  if (postType === 'VIDEO' && content.videoUrl) {
    try {
      const video = document.createElement('video');
      video.src = content.videoUrl;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          if (video.duration > MAX_VIDEO_DURATION) {
            errors.push({
              field: 'file',
              message: `Video duration cannot exceed ${MAX_VIDEO_DURATION / 60} minutes`,
            });
          }
          resolve();
        };
        video.onerror = () => reject(new Error('Failed to load video'));
      });
    } catch {
      errors.push({
        field: 'file',
        message: 'Failed to validate video content',
      });
    }
  }

  return errors;
};
