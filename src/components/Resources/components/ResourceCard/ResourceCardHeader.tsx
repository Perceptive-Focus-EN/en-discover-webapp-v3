// src/components/Resources/components/ResourceCard/ResourceCardHeader.tsx
import React, { useMemo } from 'react';
import { Box, IconButton } from '@mui/material';
import { BookmarkBorder, Bookmark } from '@mui/icons-material';
import { ShareButton } from '@/feature/posts/components/Share/ShareMenu';
import { Resource } from '../../../../types/ArticleMedia';
import { StyledCardMedia } from './styles';
import { Post, PostType, Visibility } from '@/feature/posts/api/types';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';

interface ResourceCardHeaderProps {
  resource: Resource;
  isSaved: boolean;
  onBookmark: () => void;
  onShare?: () => void;
}

export const ResourceCardHeader: React.FC<ResourceCardHeaderProps> = ({
  resource,
  isSaved,
  onBookmark,
  onShare
}) => {
  // Create post data for sharing
  const postData = useMemo((): Post => ({
    id: resource.id,
    type: 'RESOURCES' as PostType,
    userId: 'currentUserId', // Should come from auth context
    tenantId: 'currentTenantId', // Should come from auth context
    username: [resource.author.name, ''] as [string, string],
    content: {
      text: resource.abstract,
      backgroundColor: 'white',
      textColor: 'black'
    },
    commentCount: 0,
    authorId: resource.author.id || resource.id,
    timestamp: resource.datePublished,
    accountType: UserAccountTypeEnum.PERSONAL,
    createdAt: resource.datePublished,
    updatedAt: resource.datePublished,
    status: 'published' as const,
    visibility: resource.visibility as Visibility
  }), [resource]);

  return (
    <Box position="relative">
      <StyledCardMedia
        sx={{ height: 250 }}
        image={resource.imageUrl}
        title={resource.title}
      />
      <Box 
        position="absolute" 
        top={16} 
        right={16} 
        display="flex" 
        gap={1}
      >
        <IconButton
          sx={{
            bgcolor: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
          }}
          onClick={onBookmark}
        >
          {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
        </IconButton>
        <ShareButton post={postData} />
      </Box>
    </Box>
  );
};