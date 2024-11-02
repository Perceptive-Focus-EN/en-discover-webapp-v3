// src/components/Resources/components/ResourceCard/ResourceCardActions.tsx
import React from 'react';
import { Box, Button, CardMedia, Typography } from '@mui/material';
import { Resource } from '../../../../types/Resources';

interface ResourceCardActionsProps {
  resource: Resource;
  onReadMore: () => void;
}

export const ResourceCardActions: React.FC<ResourceCardActionsProps> = ({
  resource,
  onReadMore
}) => {
  return (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center" 
      p={2}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <CardMedia
          component="img"
          sx={{ width: 40, height: 40, borderRadius: '50%' }}
          image={resource.author.avatar}
          alt={resource.author.name}
        />
        <Typography fontWeight="medium">
          {resource.author.name}
        </Typography>
      </Box>
      <Button 
        variant="contained" 
        color="primary"
        onClick={onReadMore}
      >
        Read More
      </Button>
    </Box>
  );
};