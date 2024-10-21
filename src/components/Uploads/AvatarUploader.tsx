import React, { useCallback, useState, useRef } from 'react';
import { CircularProgress, Typography, Box, Tooltip, Modal, Button } from '@mui/material';
import { Edit } from '@mui/icons-material';
import AvatarEditor from 'react-avatar-editor';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { UploadResponse } from '../../types/responses/UploadResponse';
import ErrorBoundary from '../../utils/ErrorBoundary';
import { StyledAvatar, EditButton } from './AvatarUploader.styles';

interface AvatarUploaderProps {
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: string) => void;
}

const DEFAULT_AVATAR_URL = '/default-avatar.png';

export const AvatarUploader: React.FC<AvatarUploaderProps> = React.memo(({ onUploadSuccess, onUploadError }) => {
  const { avatarUrl, isUploading, error, handleAvatarUpload } = useAvatarUpload();
  const [image, setImage] = useState<File | null>(null);
  const [editor, setEditor] = useState<AvatarEditor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImage(event.target.files[0]);
      setIsModalOpen(true);
    }
  }, []);

  const handleEditClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSave = useCallback(async () => {
    if (editor) {
      const canvas = editor.getImageScaledToCanvas();
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "avatar.png", { type: "image/png" });
          try {
            const response = await handleAvatarUpload(file);
            onUploadSuccess?.(response);
          } catch (err) {
            onUploadError?.(err instanceof Error ? err.message : 'Avatar upload failed');
          }
        }
      });
    }
    setIsModalOpen(false);
  }, [editor, handleAvatarUpload, onUploadSuccess, onUploadError]);

  const avatarContent = isUploading ? <CircularProgress size={24} color="inherit" /> : null;

  return (
    <ErrorBoundary fallbackMessage="Error loading avatar uploader. Please refresh the page.">
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <StyledAvatar
          src={avatarUrl || DEFAULT_AVATAR_URL}
          alt="User Avatar"
        >
          {avatarContent}
        </StyledAvatar>
        <input
          ref={fileInputRef}
          accept="image/*"
          className="avatar-upload-input"
          id="avatar-upload"
          type="file"
          onChange={onFileChange}
          disabled={isUploading}
          title="Upload Avatar"
        />
        <Tooltip title="Change Avatar">
          <EditButton
            color="primary"
            aria-label="upload picture"
            disabled={isUploading}
            onClick={handleEditClick}
          >
            {isUploading ? <CircularProgress size={24} /> : <Edit />}
          </EditButton>
        </Tooltip>
      </Box>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="avatar-editor-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          {image && (
            <AvatarEditor
              ref={(editorRef) => setEditor(editorRef)}
              image={image}
              width={250}
              height={250}
              border={50}
              borderRadius={125}
              color={[255, 255, 255, 0.6]}
              scale={1.2}
              rotate={0}
            />
          )}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
          </Box>
        </Box>
      </Modal>
    </ErrorBoundary>
  );
});

AvatarUploader.displayName = 'AvatarUploader';

export default AvatarUploader;
