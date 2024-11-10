// src/UploadingSystem/components/upload/FileDropzone.tsx

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
    Box, 
    Paper, 
    Typography, 
    LinearProgress,
    List,
    ListItem,
    IconButton,
    Tooltip 
} from '@mui/material';
import { 
    CloudUpload, 
    FileCopy, 
    Clear,
    CheckCircleOutline,
    ErrorOutline,
    PauseCircleOutline 
} from '@mui/icons-material';
import { formatBytes } from '../../../utils/formatters';
import { UPLOAD_CONFIGS } from '../../constants/uploadConstants';

interface FileDropzoneProps {
    onFileSelect: (files: File[]) => Promise<void>;
    isUploading: boolean;
    accept: Record<string, string[]>;
    maxFiles?: number;
    maxSize?: number;
    multiple?: boolean;
}

interface QueuedFile {
    file: File;
    status: 'queued' | 'uploading' | 'completed' | 'error';
    progress?: number;
    error?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
    onFileSelect,
    isUploading,
    accept,
    maxFiles = 1,
    maxSize = 100 * 1024 * 1024, // 100MB default
    multiple = false
}) => {
    const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            status: 'queued' as const
        }));

        setQueuedFiles(prev => [...prev, ...newFiles]);

        try {
            await onFileSelect(acceptedFiles);
            // Update status for uploaded files
            setQueuedFiles(prev =>
                prev.map(qf =>
                    acceptedFiles.includes(qf.file)
                        ? { ...qf, status: 'completed' }
                        : qf
                )
            );
        } catch (error) {
            // Handle upload errors
            setQueuedFiles(prev =>
                prev.map(qf =>
                    acceptedFiles.includes(qf.file)
                        ? { 
                            ...qf, 
                            status: 'error',
                            error: error instanceof Error ? error.message : 'Upload failed'
                        }
                        : qf
                )
            );
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles,
        maxSize,
        multiple,
        disabled: isUploading
    });

    const removeFile = (index: number) => {
        setQueuedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getStatusIcon = (status: QueuedFile['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircleOutline className="text-green-500" />;
            case 'error':
                return <ErrorOutline className="text-red-500" />;
            case 'uploading':
                return <PauseCircleOutline className="text-blue-500" />;
            default:
                return <FileCopy className="text-gray-500" />;
        }
    };

    return (
        <Paper 
            elevation={3} 
            className="p-6"
        >
            <Box
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-all duration-200 ease-in-out
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
                `}
            >
                <input {...getInputProps()} />
                <CloudUpload 
                    className={`
                        text-6xl mb-4
                        ${isDragActive ? 'text-blue-500' : 'text-gray-400'}
                    `}
                />
                <Typography variant="h6" gutterBottom>
                    {isDragActive
                        ? "Drop files here..."
                        : "Drag & drop files here or click to browse"
                    }
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {`Supports: ${Object.keys(accept).join(', ')}`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {`Max size: ${formatBytes(maxSize)}`}
                </Typography>
            </Box>

            {/* File Queue */}
            {queuedFiles.length > 0 && (
                <List className="mt-4">
                    {queuedFiles.map((queuedFile, index) => (
                        <ListItem
                            key={`${queuedFile.file.name}-${index}`}
                            className="border rounded-lg mb-2 p-3"
                        >
                            <Box className="flex items-center w-full">
                                {getStatusIcon(queuedFile.status)}
                                <Box className="ml-3 flex-grow">
                                    <Typography variant="body2" noWrap>
                                        {queuedFile.file.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {formatBytes(queuedFile.file.size)}
                                    </Typography>
                                    {queuedFile.status === 'uploading' && (
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={queuedFile.progress} 
                                            className="mt-1"
                                        />
                                    )}
                                    {queuedFile.error && (
                                        <Typography variant="caption" color="error">
                                            {queuedFile.error}
                                        </Typography>
                                    )}
                                </Box>
                                <Tooltip title="Remove">
                                    <IconButton
                                        size="small"
                                        onClick={() => removeFile(index)}
                                        disabled={queuedFile.status === 'uploading'}
                                    >
                                        <Clear />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
};

export default FileDropzone;