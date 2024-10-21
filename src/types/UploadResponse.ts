// src/types/responses/UploadResponse.ts

export interface UploadResponse {
  message: string;
  avatarUrl: string;
  blobName: string;
}

export interface UploadErrorResponse {
  message: string;
  error?: string;
}