// src/features/posts/utils/contentHelpers.ts
import { 
  PostType, 
  PostContent, 
  TextContent,
  PhotoContent,
  VideoContent,
  MoodContent,
  SurveyContent 
} from '../api/types';

export const createInitialContent = (type: PostType): PostContent => {
  const baseContent = {
    caption: '',
    fontSize: 'medium' as const,
    alignment: 'left' as const,
    fontWeight: 'normal' as const,
    padding: 'medium' as const,
    metadata: {
      edited: false,
      lastEditedAt: undefined,
      originalContent: undefined
    }
  };

  switch (type) {
    case 'TEXT':
      return {
        ...baseContent,
        text: '',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        maxLines: undefined,
        isRichText: false
      } as TextContent;

    case 'PHOTO':
      return {
        ...baseContent,
        photos: [],
        layout: 'grid',
        aspectRatio: '16:9',
        tags: []
      } as PhotoContent;

    case 'VIDEO':
      return {
        ...baseContent,
        videoUrl: '',
        thumbnailUrl: '',
        duration: '0:00',
        processingStatus: 'queued',
        autoplay: false,
        muted: true,
        loop: false,
        quality: 'auto'
      } as VideoContent;

    case 'MOOD':
      return {
        ...baseContent,
        mood: '',
        color: '#FFFFFF',
        intensity: 5,
        tags: []
      } as MoodContent;

    case 'SURVEY':
      return {
        ...baseContent,
        question: '',
        options: [],
        allowMultipleChoices: false,
        showResults: true,
        totalVotes: 0
      } as SurveyContent;

    default:
      throw new Error(`Unsupported post type: ${type}`);
  }
};

// Validation helpers
export const validateContent = (content: PostContent, type: PostType): string[] => {
  const errors: string[] = [];

  switch (type) {
    case 'TEXT':
      const textContent = content as TextContent;
      if (!textContent.text.trim()) {
        errors.push('Text content is required');
      }
      break;

    case 'PHOTO':
      const photoContent = content as PhotoContent;
      if (!photoContent.photos.length) {
        errors.push('At least one photo is required');
      }
      break;

    case 'VIDEO':
      const videoContent = content as VideoContent;
      if (!videoContent.videoUrl) {
        errors.push('Video URL is required');
      }
      break;

    case 'MOOD':
      const moodContent = content as MoodContent;
      if (!moodContent.mood) {
        errors.push('Mood selection is required');
      }
      break;

    case 'SURVEY':
      const surveyContent = content as SurveyContent;
      if (!surveyContent.question) {
        errors.push('Survey question is required');
      }
      if (surveyContent.options.length < 2) {
        errors.push('At least two options are required');
      }
      break;
  }

  return errors;
};

// Helper to check if content is empty
export const isContentEmpty = (content: PostContent, type: PostType): boolean => {
  switch (type) {
    case 'TEXT':
      return !(content as TextContent).text.trim();
    case 'PHOTO':
      return (content as PhotoContent).photos.length === 0;
    case 'VIDEO':
      return !(content as VideoContent).videoUrl;
    case 'MOOD':
      return !(content as MoodContent).mood;
    case 'SURVEY':
      return !(content as SurveyContent).question || 
             (content as SurveyContent).options.length < 2;
    default:
      return true;
  }
};

// Helper to format content for display
export const formatContentForDisplay = (content: PostContent, type: PostType): string => {
  switch (type) {
    case 'TEXT':
      return (content as TextContent).text;
    case 'PHOTO':
      return `Photo post with ${(content as PhotoContent).photos.length} images`;
    case 'VIDEO':
      return 'Video post';
    case 'MOOD':
      return `Feeling ${(content as MoodContent).mood}`;
    case 'SURVEY':
      return (content as SurveyContent).question;
    default:
      return '';
  }
};

// Helper to get content preview
export const getContentPreview = (content: PostContent, type: PostType, maxLength: number = 100): string => {
  const fullText = formatContentForDisplay(content, type);
  if (fullText.length <= maxLength) return fullText;
  return `${fullText.substring(0, maxLength - 3)}...`;
};