// src/MonitoringSystem/constants/metrics.ts

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram'
}
import { useState } from 'react';
import { clientApi } from '@/lib/api_s/client';
import { apiRequest, ApiResponse, isApiError, extractErrorMessage } from '@/lib/api_s/client/utils';
import { useCallback } from 'react';
import { PhotoContent, VideoContent } from './types';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export interface UploadResponse {
  url: string;
  thumbnail?: string;
  type: 'image' | 'video';
  size: number;
  processingStatus?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface FormState {
  isProcessing: boolean;
  type?: 'PHOTO' | 'VIDEO';
  content?: PhotoContent | VideoContent;
}

export const uploadApi = {
  upload: async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> => {
    const startTime = Date.now();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');

    try {
      const response = await apiRequest.post<ApiResponse<UploadResponse>>('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: { loaded: number; total: number }) => {
          if (onProgress && progressEvent.total) {
            const progress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);

            // Record progress metric
            monitoringManager.metrics.recordMetric(
              MetricCategory.PERFORMANCE,
              'upload_progress',
              progress.percentage,
              MetricType.GAUGE,
              MetricUnit.PERCENTAGE,
              {
                fileType: file.type,
                fileSize: file.size
              }
            );
          }
        }
      });

      // Record successful upload metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'upload',
        'success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          fileType: file.type,
          fileSize: file.size,
          duration: Date.now() - startTime
        }
      );

      return response.data.data;

    } catch (error) {
      // Record upload failure metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'upload',
        'failure',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          fileType: file.type,
          fileSize: file.size,
          errorType: isApiError(error) ? error.response?.data.error.type : 'unknown'
        }
      );

      const errorMessage = extractErrorMessage(error);
      messageHandler.error(errorMessage);
      throw error;
    }
  },

  uploadMultiple: async (
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse[]> => {
    try {
      const startTime = Date.now();
      const results = await Promise.all(
        files.map(file => uploadApi.upload(file, onProgress))
      );

      // Record batch upload success metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'batch_upload',
        'success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          fileCount: files.length,
          totalSize: files.reduce((acc, file) => acc + file.size, 0),
          duration: Date.now() - startTime
        }
      );

      return results;

    } catch (error) {
      // Record batch upload failure metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'batch_upload',
        'failure',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          fileCount: files.length,
          errorType: isApiError(error) ? error.response?.data.error.type : 'unknown'
        }
      );

      const errorMessage = extractErrorMessage(error);
      messageHandler.error('Failed to upload multiple files: ' + errorMessage);
      throw error;
    }
  }
};
export enum MetricUnit {
  MILLISECONDS = 'ms',
  COUNT = 'count',
  SECONDS = 'seconds',
  BYTES = 'bytes',
  PERCENTAGE = 'percentage'
}

export enum MetricCategory {
  SYSTEM = 'system',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
  RESOURCE = 'resource',
  SECURITY = 'security',
  MESSAGING = "MESSAGING",
  API = "API",
}

// Define metric patterns similar to error patterns
export const MetricPatternsList = [
  // System Metrics
  'SYS_{component}_{action}_{timestamp}',
  // Business Metrics
  'BIZ_{operation}_{result}_{timestamp}',
  // Performance Metrics
  'PERF_{resource}_{measurement}_{timestamp}',
  // Resource Metrics
  'RES_{type}_{usage}_{timestamp}'
] as const;