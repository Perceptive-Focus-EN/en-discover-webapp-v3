import { Resource } from './resources';

// src/features/resources/types/index.ts
export * from './actions';
export * from './api';
export * from './config';
export * from './filters';
export * from './form';
export * from './interactions';
export * from './list';
export * from './metadata';
export * from './permissions';
export * from './resources';

// Type guard
export const isResource = (value: any): value is Resource => {
  return (
    value &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.abstract === 'string' &&
    typeof value.content === 'string' &&
    Array.isArray(value.categories) &&
    typeof value.readTime === 'number' &&
    typeof value.rating === 'number' &&
    typeof value.votes === 'number' &&
    typeof value.author === 'object' &&
    typeof value.author.name === 'string' &&
    typeof value.author.avatar === 'string' &&
    typeof value.datePublished === 'string'
  );
};