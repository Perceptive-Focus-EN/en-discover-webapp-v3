// src/utils/upload.ts
export const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  return seconds > 60 
    ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    : `${seconds}s`;
};

export const calculateProgress = (
  current: number,
  total: number
): number => {
  return total > 0 ? Math.round((current / total) * 100) : 0;
};