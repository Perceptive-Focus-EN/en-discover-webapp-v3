// src/components/Resources/components/ResourceDialog/DialogHeader.tsx
import React from 'react';
import { IconButton, Box } from '@mui/material';
import { 
  ArrowBack, 
  BookmarkBorder, 
  Bookmark, 
  Share 
} from '@mui/icons-material';
import { DialogHeaderContainer } from './styles';

interface DialogHeaderProps {
  isSaved: boolean;
  onClose: () => void;
  onBookmark: () => void;
  onShare: () => void;
  loading?: boolean;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  isSaved,
  onClose,
  onBookmark,
  onShare,
  loading
}) => {
  return (
    <DialogHeaderContainer>
      <IconButton 
        onClick={onClose}
        edge="start"
        aria-label="close"
      >
        <ArrowBack />
      </IconButton>
      <Box display="flex" gap={1}>
        <IconButton 
          onClick={onBookmark}
          disabled={loading}
          aria-label={isSaved ? 'remove bookmark' : 'bookmark'}
        >
          {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
        </IconButton>
        <IconButton 
          onClick={onShare}
          disabled={loading}
          aria-label="share"
        >
          <Share />
        </IconButton>
      </Box>
    </DialogHeaderContainer>
  );
};