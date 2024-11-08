// src/pages/upload/index.tsx
import { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Container } from '@mui/material';
import ErrorBoundary from '@/components/ErrorBoundary';
import { uploadApi } from '@/lib/api/uploads';
import { FileCategory } from '@/UploadingSystem/constants/uploadConstants';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { FileDropzone } from '@/UploadingSystem/components/upload/FileDropzone';

const UploadPage: NextPage = () => {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);

    const determineFileCategory = (file: File): FileCategory => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type === 'application/pdf' || 
            file.type === 'application/msword' || 
            file.type.includes('document')) return 'document';
        return 'other';
    };

    const handleFileSelect = async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const category = determineFileCategory(file);
            const response = await uploadApi.uploadFile(file, category);
            messageHandler.success('Upload started');
            router.push(`/upload/visualization?trackingId=${response.trackingId}`);
        } catch (error) {
            messageHandler.error('Failed to start upload');
            setIsUploading(false);
        }
    };

    return (
        <ErrorBoundary>
            <Container maxWidth="lg">
                <Box className="py-8">
                    <FileDropzone 
                        onFileSelect={handleFileSelect}
                        isUploading={isUploading}
                        accept={{
                            'image/*': [],
                            'video/*': [],
                            'audio/*': [],
                            'application/pdf': [],
                            'application/msword': [],
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
                        }}
                    />
                </Box>
            </Container>
        </ErrorBoundary>
    );
};

export default UploadPage;