// src/UploadingSystem/components/upload/FileDropzone.tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import { Upload } from 'lucide-react';

interface FileDropzoneProps {
    onFileSelect: (files: File[]) => void;
    isUploading: boolean;
    accept?: Record<string, string[]>;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
    onFileSelect,
    isUploading,
    accept
}) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFileSelect(acceptedFiles);
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        disabled: isUploading,
        multiple: false
    });

    return (
        <Box 
            {...getRootProps()} 
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg 
                ${isUploading 
                    ? 'cursor-not-allowed bg-gray-100 border-gray-300' 
                    : 'cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
                }`}
        >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mb-4 text-gray-500" />
            <Typography className="mb-2 text-sm text-gray-500">
                {isDragActive
                    ? "Drop the file here"
                    : <span>
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </span>
                }
            </Typography>
            {isUploading && (
                <Typography className="text-xs text-gray-400">
                    Upload in progress...
                </Typography>
            )}
        </Box>
    );
};

export default FileDropzone;