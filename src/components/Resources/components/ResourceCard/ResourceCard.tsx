// src/components/Resources/components/ResourceCard/ResourceCard.tsx
import React from 'react';
import { useResourceActions } from '../../hooks/useResourceActions';
import { Resource } from '../../../../types/Resources';
import { StyledCard } from './styles';
import { ResourceCardHeader } from './ResourceCardHeader';
import { ResourceCardContent } from './ResourceCardContent';
import { ResourceCardActions } from './ResourceCardActions';

interface ResourceCardProps {
  resource: Resource;
  onReadMore: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onReadMore
}) => {
  const { handleBookmark, isLoading } = useResourceActions();
  const [isSaved, setIsSaved] = React.useState(false);

  const handleBookmarkClick = async () => {
    const result = await handleBookmark(resource.id);
    if (result.success) {
      setIsSaved(result.data || false);
    }
  };

  const handleShare = () => {
    // Implement share functionality
  };

  return (
    <StyledCard>
      <ResourceCardHeader
        resource={resource}
        isSaved={isSaved}
        onBookmark={handleBookmarkClick}
        onShare={handleShare}
      />
      <ResourceCardContent resource={resource} />
      <ResourceCardActions 
        resource={resource}
        onReadMore={onReadMore}
      />
    </StyledCard>
  );
};