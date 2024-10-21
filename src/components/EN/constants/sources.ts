// src/constants/emotionsAndCategories.ts

export const SOURCE_CATEGORIES = [
  { id: 1, name: 'Everything' },
  { id: 2, name: 'Family' },
  { id: 3, name: 'Friends' },
  { id: 4, name: 'Relations' },
  { id: 5, name: 'Work' },
  { id: 6, name: 'Health' },
  { id: 7, name: 'Life' },
] as const;

export type SourceCategory = typeof SOURCE_CATEGORIES[number];
export type SourceCategoryId = SourceCategory['id'];
export type SourceCategoryName = SourceCategory['name'];