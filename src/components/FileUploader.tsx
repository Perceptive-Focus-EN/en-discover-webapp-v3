// src/components/FileUploader.tsx
import { FC, useState } from 'react';
import { toast } from 'react-hot-toast';
import { UploadProgress } from './UploadProgress';
import { api } from '@/lib/axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface FileUploaderProps {
    userId: string;
    tenantId: string;
}

export const FileUploader: FC<FileUploaderProps> = ({ userId, tenantId }) => {
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post<{ trackingId: string }>('/api/uploads/enhancedSecurityUpload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                // Pass file type as query parameter
                params: {
                    type: file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('video/') ? 'video' : 'document'
                }
            });

            setUploadId(response.trackingId);
            messageHandler.success('Upload started');
        } catch (error) {
            messageHandler.error('Failed to start upload');
            setIsUploading(false);
        }
    };

    const handleControlAction = async (action: string) => {
        if (!uploadId) return;

        try {
            await api.post(`/api/uploads/${uploadId}/${action}`);
            messageHandler.success(`Upload ${action} successful`);
        } catch (error) {
            messageHandler.error(`Failed to ${action} upload`);
        }
    };

    return (
        <div className="space-y-4">
            {/* File Input */}
            <div className="flex items-center justify-center w-full">
                <label 
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg 
                        ${isUploading 
                            ? 'cursor-not-allowed bg-gray-100 border-gray-300' 
                            : 'cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        {isUploading && <p className="text-xs text-gray-400">Upload in progress...</p>}
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        accept="image/*,video/*,application/pdf"
                    />
                </label>
            </div>

            {/* Upload Progress */}
            {uploadId && (
                <UploadProgress
                    trackingId={uploadId}
                    userId={userId}
                    onPause={() => handleControlAction('pause')}
                    onResume={() => handleControlAction('resume')}
                    onRetry={() => handleControlAction('retry')}
                    onCancel={() => handleControlAction('cancel')}
                    onComplete={() => {
                        messageHandler.success('Upload completed successfully!');
                        setIsUploading(false);
                        setUploadId(null);
                    }}
                    onError={(error) => {
                        messageHandler.error(`Upload error: ${error.message}`);
                        setIsUploading(false);
                    }}
                />
            )}
        </div>
    );
};