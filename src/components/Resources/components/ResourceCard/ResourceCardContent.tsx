// src/components/Resources/components/ResourceCard/ResourceCardContent.tsx
import React from 'react';
import { Box, Typography, Rating } from '@mui/material';
import { Resource } from '../../../../types/Resources';
import { CategoryChip, ReadTimeChip } from './styles';

interface ResourceCardContentProps {
  resource: Resource;
}

export const ResourceCardContent: React.FC<ResourceCardContentProps> = ({
  resource
}) => {
  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" gap={1}>
          {resource.categories.map(category => (
            <CategoryChip key={category} label={category} />
          ))}
        </Box>
        <ReadTimeChip>{resource.readTime} min read</ReadTimeChip>
      </Box>
      
      <Typography variant="h5" gutterBottom fontWeight="bold">
        {resource.title}
      </Typography>
      
      <Typography color="text.secondary" mb={2}>
        {resource.abstract}
      </Typography>
      
      <Box display="flex" alignItems="center" gap={2}>
        <Rating value={resource.rating} readOnly precision={0.5} />
        <Typography color="text.secondary">
          ({resource.votes} votes)
        </Typography>
      </Box>
    </Box>
  );
};