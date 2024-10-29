// src/components/Feed/PhotoUploader.tsx
import React from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { Button, Box } from '@mui/material';

interface PhotoUploaderProps {
  images: ImageListType;
  onUpload: (images: ImageListType) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ images, onUpload }) => {
  const maxNumber = 4;

  return (
    <ImageUploading
      multiple
      value={images}
      onChange={onUpload}
      maxNumber={maxNumber}
    >
      {({
        imageList,
        onImageUpload,
        onImageRemoveAll,
        onImageUpdate,
        onImageRemove,
        isDragging,
        dragProps,
      }) => (
        <Box>
          <Button
            style={isDragging ? { color: 'red' } : undefined}
            onClick={onImageUpload}
            {...dragProps}
          >
            Click or Drop here
          </Button>
          &nbsp;
          <Button onClick={onImageRemoveAll}>Remove all images</Button>
          {imageList.map((image, index) => (
            <Box key={index} className="image-item">
              <img src={image.dataURL} alt="" width="100" />
              <Box className="image-item__btn-wrapper">
                <Button onClick={() => onImageUpdate(index)}>Update</Button>
                <Button onClick={() => onImageRemove(index)}>Remove</Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </ImageUploading>
  );
};