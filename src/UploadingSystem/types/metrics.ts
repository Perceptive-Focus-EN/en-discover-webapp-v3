// src/UploadingSystem/types/metrics.ts
export interface StepMetrics {
    chunkProgress: number;
    activeUploads?: number;
    queueSize?: number;
    memoryUsage?: number;
}