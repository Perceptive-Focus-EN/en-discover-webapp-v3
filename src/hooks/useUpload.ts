// src/hooks/useUpload.ts
import { useState, useCallback } from 'react';
import { uploadApi } from '@/lib/api/uploads';
import { FileCategory } from '@/UploadingSystem/constants/uploadConstants';

export function useUpload() {
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const upload = useCallback(async (file: File, category: FileCategory) => {
        setIsUploading(true);
        setError(null);
        try {
            const response = await uploadApi.uploadFile(file, category, (info) => setProgress((info.loaded / info.total) * 100));
            return response;
        } catch (err) {
            const error = err as Error;
            setError(error.message);
            throw error;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const resumeUpload = useCallback(async (
        file: File,
        trackingId: string,
        lastChunk: number,
        category: FileCategory
    ) => {
        setIsUploading(true);
        setError(null);
        try {
            const response = await uploadApi.resumeUpload(
                file,
                trackingId,
                lastChunk,
                category,
                (info) => setProgress(info.loaded / info.total * 100)
            );
            return response;
        } catch (err) {
            const error = err as Error;
            setError(error.message);
            throw error;
        } finally {
            setIsUploading(false);
        }
    }, []);

// Fixed: Return getUploadStatus directly from uploadApi
       return {
        upload,
        resumeUpload,
        progress,
        error,
        isUploading,
        getStatus: uploadApi.getUploadStatus,  // Note: changed from getUploadStatus to match API
        cancel: uploadApi.cancelUpload,
        getHistory: uploadApi.getUploadHistory
    };
}