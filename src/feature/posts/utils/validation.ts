
// src/features/posts/utils/validation.ts

import { 
    PostType, 
    PostContent,
    TextContent,
    PhotoContent,
    VideoContent,
    MoodContent,
    SurveyContent,
    Media
} from '../api/types';
import { UPLOAD_CONFIGS, FileCategory } from '@/UploadingSystem/constants/uploadConstants';

export interface ValidationError {
    field: string;
    message: string;
}

interface ValidationRule<T> {
    validate: (value: T) => ValidationError[];
}

// Constants aligned with UPLOAD_CONFIGS
export const POST_LIMITS = {
    TEXT: {
        MAX_LENGTH: 5000,
        MIN_LENGTH: 1
    },
    PHOTO: {
        MAX_COUNT: 10,
        MIN_COUNT: 1,
        MAX_CAPTION_LENGTH: 1000
    },
    VIDEO: {
        MAX_CAPTION_LENGTH: 1000,
        MAX_DURATION: 300 // 5 minutes in seconds
    },
    MOOD: {
        MAX_LENGTH: 200,
        MIN_LENGTH: 1
    },
    SURVEY: {
        MAX_QUESTION_LENGTH: 500,
        MAX_OPTION_LENGTH: 100,
        MIN_OPTIONS: 2,
        MAX_OPTIONS: 10
    }
} as const;

export const validateMedia = async (media: Media | undefined, type: PostType): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    if (!media) {
        if (type === PostType.PHOTO || type === PostType.VIDEO) {
            return [{ field: 'media', message: `${type.toLowerCase()} is required` }];
        }
        return [];
    }

    if (!media) {
        return errors;
    }
    const config = UPLOAD_CONFIGS[media.category as FileCategory];

    // Check URLs
    if (!media.urls || media.urls.length === 0) {
        errors.push({ field: 'media', message: 'Media URL is required' });
    const config = UPLOAD_CONFIGS[media.category as keyof typeof FileCategory];
        // Validate each URL
        media.urls.forEach((url, index) => {
            if (!url || !/^https?:\/\/.+/.test(url)) {
                errors.push({ field: 'media', message: `Invalid URL for media ${index + 1}` });
            }
        });

        // Check count limits
        if (type === PostType.PHOTO && media.urls.length > POST_LIMITS.PHOTO.MAX_COUNT) {
            errors.push({ 
                field: 'media', 
                message: `Cannot upload more than ${POST_LIMITS.PHOTO.MAX_COUNT} photos` 
            });
        }
        return errors;
    }

    // Check metadata
    if (media.metadata) {
        if (media.metadata?.fileSize > config.maxSize) {
            const maxSizeMB = Math.floor(config.maxSize / (1024 * 1024));
            errors.push({ 
                field: 'media', 
    if (media.metadata && media.metadata.fileSize) {
        if (media.metadata.fileSize > config.maxSize) {
            const maxSizeMB = Math.floor(config.maxSize / (1024 * 1024));
            errors.push({ 
                field: 'media', 
                message: `File size exceeds the maximum limit of ${maxSizeMB}MB` 
            });
        }

        if (!config.contentType.includes(media.metadata.contentType) && !config.contentType.includes('*/*')) {
            errors.push({ 
                field: 'media', 
                message: `Invalid file type. Allowed types: ${config.contentType.join(', ')}` 
            });
        }
    }

    return errors;
};

export const validateContent = (content: PostContent, type: PostType): ValidationError[] => {
    const errors: ValidationError[] = [];

    switch (type) {
        case PostType.TEXT: {
            const textContent = content as TextContent;
            if (!textContent.text || textContent.text.trim().length === 0) {
                errors.push({ field: 'content', message: 'Text cannot be empty' });
            }
            if (textContent.text.length > POST_LIMITS.TEXT.MAX_LENGTH) {
                errors.push({ 
                    field: 'content', 
                    message: `Text cannot exceed ${POST_LIMITS.TEXT.MAX_LENGTH} characters` 
                });
            }
            break;
        }

        case PostType.PHOTO: {
            const photoContent = content as PhotoContent;
            if (photoContent.photos && photoContent.photos.length > POST_LIMITS.PHOTO.MAX_COUNT) {
                errors.push({ 
                    field: 'content', 
                    message: `Cannot have more than ${POST_LIMITS.PHOTO.MAX_COUNT} photos` 
                });
            }
            if (photoContent.caption && photoContent.caption.length > POST_LIMITS.PHOTO.MAX_CAPTION_LENGTH) {
                errors.push({ 
                    field: 'caption', 
                    message: `Caption cannot exceed ${POST_LIMITS.PHOTO.MAX_CAPTION_LENGTH} characters` 
                });
            }
            break;
        }

        case PostType.VIDEO: {
            const videoContent = content as VideoContent;
            if (videoContent.caption && videoContent.caption.length > POST_LIMITS.VIDEO.MAX_CAPTION_LENGTH) {
                errors.push({ 
                    field: 'caption', 
                    message: `Caption cannot exceed ${POST_LIMITS.VIDEO.MAX_CAPTION_LENGTH} characters` 
                });
            }
            break;
        }

        case PostType.MOOD: {
            const moodContent = content as MoodContent;
            if (!moodContent.mood || moodContent.mood.trim().length === 0) {
                errors.push({ field: 'mood', message: 'Mood cannot be empty' });
            }
            if (moodContent.mood.length > POST_LIMITS.MOOD.MAX_LENGTH) {
                errors.push({ 
                    field: 'mood', 
                    message: `Mood cannot exceed ${POST_LIMITS.MOOD.MAX_LENGTH} characters` 
                });
            }
            break;
        }

        case PostType.SURVEY: {
            const surveyContent = content as SurveyContent;
            if (!surveyContent.question || surveyContent.question.trim().length === 0) {
                errors.push({ field: 'question', message: 'Question cannot be empty' });
            }
            if (surveyContent.question.length > POST_LIMITS.SURVEY.MAX_QUESTION_LENGTH) {
                errors.push({ 
                    field: 'question', 
                    message: `Question cannot exceed ${POST_LIMITS.SURVEY.MAX_QUESTION_LENGTH} characters` 
                });
            }
            if (!surveyContent.options || surveyContent.options.length < POST_LIMITS.SURVEY.MIN_OPTIONS) {
                errors.push({ 
                    field: 'options', 
                    message: `Must have at least ${POST_LIMITS.SURVEY.MIN_OPTIONS} options` 
                });
            }
            if (surveyContent.options && surveyContent.options.length > POST_LIMITS.SURVEY.MAX_OPTIONS) {
                errors.push({ 
                    field: 'options', 
                    message: `Cannot have more than ${POST_LIMITS.SURVEY.MAX_OPTIONS} options` 
                });
            }
            surveyContent.options?.forEach((option, index) => {
                if (option.text.length > POST_LIMITS.SURVEY.MAX_OPTION_LENGTH) {
                    errors.push({ 
                        field: `option_${index}`, 
                        message: `Option cannot exceed ${POST_LIMITS.SURVEY.MAX_OPTION_LENGTH} characters` 
                    });
                }
            });
            break;
        }
    }

    return errors;
};

export const validatePost = async (
    type: PostType,
    content: PostContent,
    media?: Media
): Promise<ValidationError[]> => {
    let errors: ValidationError[] = [];

    // Validate content
    errors = errors.concat(validateContent(content, type));

    // Validate media if present or required
    const mediaErrors = await validateMedia(media, type);
    errors = errors.concat(mediaErrors);

    return errors;
};

export const isValidationError = (error: unknown): error is ValidationError => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'field' in error &&
        'message' in error &&
        typeof (error as ValidationError).field === 'string' &&
        typeof (error as ValidationError).message === 'string'
    );
};