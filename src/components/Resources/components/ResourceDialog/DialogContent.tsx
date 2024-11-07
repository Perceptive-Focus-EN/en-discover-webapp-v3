// src/components/Resources/components/ResourceDialog/DialogContent.tsx
import React from 'react';
import { 
  Typography, 
  Chip, 
  Box, 
  Avatar, 
  Divider,
  Rating
} from '@mui/material';
import { Resource } from '../../../../types/ArticleMedia';
import { ContentContainer, MetadataContainer } from './styles';
import { formatDate } from '../../utils/dateUtils';

interface DialogContentProps {
  resource: Resource;
  onRate?: (rating: number) => void;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  resource,
  onRate
}) => {
  return (
    <ContentContainer>
      <MetadataContainer elevation={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" gap={1} flexWrap="wrap">
            {resource.categories.map(category => (
              <Chip 
                key={category}
                label={category}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
          <Typography color="text.secondary" variant="body2">
            {resource.readTime} min read
          </Typography>
        </Box>

        <Typography variant="h4" gutterBottom>
          {resource.title}
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar 
            src={resource.author.avatar} 
            alt={resource.author.name}
          />
          <Box>
            <Typography variant="subtitle1">
              {resource.author.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Published on {formatDate(resource.datePublished)}
            </Typography>
          </Box>
        </Box>

        {resource.author.bio && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            mb={2}
          >
            {resource.author.bio}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={2}>
          <Rating 
            value={resource.rating}
            precision={0.5}
            onChange={(_, value) => onRate?.(value || 0)}
          />
          <Typography variant="body2" color="text.secondary">
            ({resource.votes} votes)
          </Typography>
        </Box>
      </MetadataContainer>

      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        paragraph
      >
        {resource.abstract}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Resource content rendering */}
      <Typography variant="body1">
        {resource.content}
      </Typography>

      {resource.metadata && (
        <>
          <Divider sx={{ my: 3 }} />
          {/* Render additional metadata, references, etc. */}
        </>
      )}
    </ContentContainer>
  );
};