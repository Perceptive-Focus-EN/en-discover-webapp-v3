// src/features/posts/components/PostEditor/MediaUploader.tsx

import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconButton, CircularProgress, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';

interface MediaUploaderProps {
  type: 'photo' | 'video';
  files: File[];
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (index: number) => void;
  maxFiles: number;
  // Add the new props
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  onErrorDismiss?: () => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  type,
  files,
  onUpload,
  onRemove,
  maxFiles,
  // Add the new props with defaults
  isUploading = false,
  uploadProgress = 0,
  error = null,
  onErrorDismiss
}) => {
  const { getRootProps, getInputProps, fileRejections, acceptedFiles } = useDropzone({
    accept: type === 'photo' ? { 'image/*': [] } : { 'video/*': [] },
    maxFiles,
    onDrop: async (acceptedFiles) => {
      try {
        const fileList = new DataTransfer();
        acceptedFiles.forEach((file) => fileList.items.add(file));
        await onUpload(fileList.files);
      } catch (err) {
        console.error('Error uploading files:', err);
      }
    }
  });

  useEffect(() => {
    if (fileRejections.length > 0) {
      fileRejections.forEach((rejection) => {
        console.error(`Rejected file: ${rejection.file.name} - ${rejection.errors[0].message}`);
      });
    }
  }, [fileRejections]);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-4 text-center cursor-pointer"
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <CircularProgress size={24} />
            <Typography variant="body2">{uploadProgress}% Uploaded</Typography>
          </div>
        ) : (
          <p>
            Drag & drop or click to select {type === 'photo' ? 'photos' : 'video'}
          </p>
        )}
      </div>

      {error && (
        <Typography 
          color="error" 
          variant="body2" 
          onClick={onErrorDismiss}
          className="cursor-pointer"
        >
          {error}
        </Typography>
      )}

      <div className="grid grid-cols-4 gap-4">
        {files.map((file, index) => (
          <div key={index} className="relative">
            {type === 'photo' ? (
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover"
                onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
              />
            ) : (
              <video
                src={URL.createObjectURL(file)}
                className="w-full h-24 object-cover"
                controls
                onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
              />
            )}
            <IconButton
              size="small"
              className="absolute top-0 right-0"
              onClick={() => onRemove(index)}
              disabled={isUploading}
            >
              <Delete />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
};