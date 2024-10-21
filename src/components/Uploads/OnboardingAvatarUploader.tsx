import React from 'react';
import { Button, Avatar, Typography, Box } from '@mui/material';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { UploadResponse } from '../../types/responses/UploadResponse';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingAvatarUploaderProps {
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: string) => void;
}

export const OnboardingAvatarUploader: React.FC<OnboardingAvatarUploaderProps> = ({
  onUploadSuccess,
  onUploadError
}) => {
  const { avatarUrl, isUploading, error, handleAvatarUpload, refreshAvatarUrl } = useAvatarUpload();
  const { user } = useAuth();

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const response = await handleAvatarUpload(file);
        onUploadSuccess?.(response);
        await refreshAvatarUrl();
      } catch (err) {
        onUploadError?.(err instanceof Error ? err.message : 'Avatar upload failed');
      }
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Box textAlign="center" className="avatar-uploader">
      <Avatar
        src={avatarUrl || undefined}
        alt="User Avatar"
        sx={{ width: 120, height: 120, margin: '0 auto 16px' }}
      >
        {user?.firstName ? getInitials(user.firstName) : '?'}
      </Avatar>
      <input
        accept="image/*"
        className="avatar-upload-input"
        id="avatar-upload"
        type="file"
        onChange={onFileChange}
        disabled={isUploading}
      />
      <label htmlFor="avatar-upload">
        <Button variant="contained" component="span" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Profile Picture'}
        </Button>
      </label>
      {error ? (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          {error}
        </Typography>
      ) : !avatarUrl ? (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Adding a profile picture helps your team recognize you. It&apos;s optional, but recommended!
        </Typography>
      ) : null}
    </Box>
  );
};