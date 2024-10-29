// src/features/posts/components/PostEditor/MediaUploader.tsx

import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';

interface MediaUploaderProps {
  type: 'photo' | 'video';
  files: File[];
  onUpload: (files: FileList) => Promise<void>; // Renamed from 'onAdd' to 'onUpload'
  onRemove: (index: number) => void;
  maxFiles: number;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  type,
  files,
  onUpload, // Updated from 'onAdd'
  onRemove,
  maxFiles
}) => {
  const { getRootProps, getInputProps, fileRejections, acceptedFiles } = useDropzone({
    accept: type === 'photo' ? { 'image/*': [] } : { 'video/*': [] },
    maxFiles,
    onDrop: async (acceptedFiles) => {
      try {
        // Convert acceptedFiles to FileList
        const fileList = new DataTransfer();
        acceptedFiles.forEach((file) => fileList.items.add(file));

        // Call onUpload with the generated FileList
        await onUpload(fileList.files); // Renamed from 'onAdd'
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
        <input {...getInputProps()} />
        <p>
          Drag & drop or click to select {type === 'photo' ? 'photos' : 'video'}
        </p>
      </div>

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
            >
              <Delete />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
};
