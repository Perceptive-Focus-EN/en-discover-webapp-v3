// src/utils/unitConversion.ts
// CONVERTING STORAGE AND EXECUTIONS TO READABLE FORMATS FOR DISPLAY ON THE FRONTEND
// The formatStorage function takes a number of bytes and returns a human-readable string representing the storage size.

// The formatExecutions function takes a number of executions and returns a human-readable string representing the number of executions.
const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

export function formatStorage(bytes: number): string {
  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(2)} KB`;
  return `${bytes} B`;
}

export function formatExecutions(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(2)} million`;
  if (count >= 1000) return `${(count / 1000).toFixed(2)}K`;
  return count.toString();
}