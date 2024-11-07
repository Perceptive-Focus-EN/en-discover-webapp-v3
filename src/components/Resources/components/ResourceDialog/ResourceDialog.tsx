// src/components/Resources/components/ResourceDialog/ResourceDialog.tsx
import React from 'react';
import { Dialog } from '@mui/material';
import { useResourceActions } from '../../hooks/useResourceActions';
import { Resource } from '../../../../types/ArticleMedia';
import { DialogContainer } from './styles';
import { DialogHeader } from './DialogHeader';
import { DialogContent } from './DialogContent';

interface ResourceDialogProps {
  resource: Resource;
  open: boolean;
  onClose: () => void;
}

export const ResourceDialog: React.FC<ResourceDialogProps> = ({
  resource,
  open,
  onClose
}) => {
  const { 
    handleBookmark, 
    isLoading 
  } = useResourceActions();

  const [isSaved, setIsSaved] = React.useState(
    resource.interactions?.isBookmarked || false
  );

  const handleBookmarkClick = async () => {
    const result = await handleBookmark(resource.id);
    if (result.success) {
      setIsSaved(result.data || false);
    }
  };

  const handleShare = () => {
    // Implement share functionality
  };

  const handleRateResource = async (rating: number) => {
    // Handle rating update if needed
  };

  return (
    <Dialog 
      fullScreen 
      open={open} 
      onClose={onClose}
    >
      <DialogContainer>
        <DialogHeader
          isSaved={isSaved}
          onClose={onClose}
          onBookmark={handleBookmarkClick}
          onShare={handleShare}
          loading={isLoading('bookmark', resource.id)}
        />
        <DialogContent 
          resource={resource}
          onRate={handleRateResource}
        />
      </DialogContainer>
    </Dialog>
  );
};