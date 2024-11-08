// src/features/posts/components/PostEditor/MediaUploader.tsx

import React, { useEffect, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconButton, CircularProgress, Typography, Box, LinearProgress } from '@mui/material';
import { Delete, CloudUpload, Error as ErrorIcon } from '@mui/icons-material';
import { FileCategory, UPLOAD_CONFIGS, UPLOAD_STATUS } from '@/UploadingSystem/constants/uploadConstants';

interface MediaUploaderProps {
  type: 'photo' | 'video';
  files: Array<{
    url: string;
    type: string;
    name: string;
  }>;
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (index: number) => void;
  maxFiles: number;
  isUploading?: boolean;
  isProcessing?: boolean;
  uploadProgress?: number;
  error?: string | null;
  onErrorDismiss?: () => void;
  currentChunk?: number;
  totalChunks?: number;
  uploadSpeed?: number;
  remainingTime?: number;
  processingStatus?: string | null;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  type,
  files,
  onUpload,
  onRemove,
  maxFiles,
  isUploading = false,
  isProcessing = false,
  uploadProgress = 0,
  error = null,
  onErrorDismiss,
  currentChunk,
  totalChunks,
  uploadSpeed,
  remainingTime,
  processingStatus
}) => {
  const fileCategory = useMemo((): FileCategory => 
    type === 'photo' ? FileCategory.IMAGE : FileCategory.VIDEO
  , [type]);

  const config = useMemo(() => 
    UPLOAD_CONFIGS[fileCategory]
  , [fileCategory]);

  const validateFileSize = useCallback((file: File) => {
    const maxSize = UPLOAD_CONFIGS[type === 'photo' ? 'image' : 'video'].maxSize;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${Math.floor(maxSize / (1024 * 1024))}MB limit`);
    }
  }, [type]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      // Validate each file before processing
      acceptedFiles.forEach(validateFileSize);
      
      const fileList = new DataTransfer();
      acceptedFiles.forEach(file => {
        fileList.items.add(file);
      });
      
      await onUpload(fileList.files);
    } catch (err) {
      console.error('Error uploading files:', err);
    }
  }, [onUpload, validateFileSize]);

  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    accept: type === 'photo' 
      ? { 'image/*': config.contentType }
      : { 'video/*': config.contentType },
    maxFiles: maxFiles - files.length,
    maxSize: config.maxSize,
    disabled: isUploading || isProcessing,
    onDrop
  });

  const formatSpeed = useCallback((speed?: number) => {
    if (!speed) return '';
    return `${(speed / (1024 * 1024)).toFixed(2)} MB/s`;
  }, []);

  const formatTime = useCallback((seconds?: number) => {
    if (!seconds) return '';
    return `${Math.ceil(seconds)}s remaining`;
  }, []);

  useEffect(() => {
    if (fileRejections.length > 0) {
      fileRejections.forEach((rejection) => {
        const errors = rejection.errors.map(e => e.message).join(', ');
        console.error(`Rejected file: ${rejection.file.name} - ${errors}`);
      });
    }
  }, [fileRejections]);

  useEffect(() => {
    return () => {
      // Clean up any object URLs when component unmounts
      files.forEach(file => {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [files]);

  const renderProgress = () => {
    if (!isUploading && !isProcessing) return null;

    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={uploadProgress} 
          color={isProcessing ? "secondary" : "primary"} 
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isProcessing 
              ? `Processing: ${processingStatus || 'In Progress'}` 
              : `Uploading: ${uploadProgress}%`}
          </Typography>
          {isUploading && (
            <Typography variant="body2" color="text.secondary">
              {currentChunk && totalChunks && `Chunk ${currentChunk}/${totalChunks} • `}
              {formatSpeed(uploadSpeed)} • {formatTime(remainingTime)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          p: 3,
          textAlign: 'center',
          cursor: isUploading || isProcessing ? 'not-allowed' : 'pointer',
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: !isUploading && !isProcessing ? 'action.hover' : undefined
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 40, mb: 1, color: 'text.secondary' }} />
        <Typography variant="body1">
          {isUploading || isProcessing ? (
            'Upload in progress...'
          ) : (
            `Drag & drop or click to select ${type === 'photo' ? 'photos' : 'video'}`
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`Max size: ${Math.floor(config.maxSize / (1024 * 1024))}MB`}
        </Typography>
      </Box>

      {renderProgress()}

      {error && (
        <Box 
          sx={{ 
            mt: 2, 
            p: 1, 
            bgcolor: 'error.light', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
          onClick={onErrorDismiss}
        >
          <ErrorIcon color="error" />
          <Typography color="error.dark" variant="body2">
            {error}
          </Typography>
        </Box>
      )}

      {files.length > 0 && (
        <Box sx={{ 
          mt: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 2
        }}>
          {files.map((file, index) => (
            <Box key={index} sx={{ position: 'relative' }}>
              {file.type.includes('image') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 4
                  }}
                />
              ) : (
                <video
                  src={file.url}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 4
                  }}
                  controls
                />
              )}
              <IconButton
                size="small"
                onClick={() => onRemove(index)}
                disabled={isUploading || isProcessing}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'background.paper'
                  }
                }}
              >
                <Delete />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};