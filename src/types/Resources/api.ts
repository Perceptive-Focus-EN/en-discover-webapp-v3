// src/features/resources/types/api.ts





export interface ResourceApiError {
  message: string;
  code: string;
  details?: any;
}

export interface UploadResponse {
  data: {
    url: string;
    type: string;
    size: number;
    filename: string;
    processingStatus?: string;
    metadata: {
      originalName: string;
      mimeType: string;
      uploadedAt: string;
    };
  };
  message: string;
}