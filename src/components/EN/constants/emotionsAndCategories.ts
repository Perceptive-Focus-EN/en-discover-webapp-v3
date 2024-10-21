// src/constants/emotionsAndCategories.ts

export const EmotionCategories = {
  EUPHORIC: { id: 1, name: 'EUPHORIC' },
  TRANQUIL: { id: 2, name: 'TRANQUIL' },
  REACTIVE: { id: 3, name: 'REACTIVE' },
  SORROW: { id: 4, name: 'SORROW' },
  FEAR: { id: 5, name: 'FEAR' },
  DISGUST: { id: 6, name: 'DISGUST' },
  SUSPENSE: { id: 7, name: 'SUSPENSE' },
  ENERGY: { id: 8, name: 'ENERGY' }
} as const;

export type EmotionName = keyof typeof EmotionCategories;
export type EmotionId = typeof EmotionCategories[EmotionName]['id'];



interface UserEmotion {
  userId: string;
  emotionId: EmotionId;
  sourceCategoryId: SourceCategoryId;
  sourceId?: number;  // Optional, for user-defined 
  volume: number;
  timestamp: Date;
}


export const SourceCategories = {
  EVERYTHING: { id: 1, name: 'Everything' },
  FAMILY: { id: 2, name: 'Family' },
  FRIENDS: { id: 3, name: 'Friends' },
  RELATIONS: { id: 4, name: 'Relations' },
  WORK: { id: 5, name: 'Work' },
  HEALTH: { id: 6, name: 'Health' },
  LIFE: { id: 7, name: 'Life' }
} as const;

export type SourceCategoryName = keyof typeof SourceCategories;
export type SourceCategoryId = typeof SourceCategories[SourceCategoryName]['id'];

export interface Source {
  id: number;
  name: string;
  categoryId: SourceCategoryId;
}

// Helper functions
export function getEmotionById(id: EmotionId) {
  return Object.values(EmotionCategories).find(emotion => emotion.id === id);
}

export function getSourceCategoryById(id: SourceCategoryId) {
  return Object.values(SourceCategories).find(category => category.id === id);
}