import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia } from '@mui/material';
import { DisplayTypeOption } from './types/displays';

interface DisplayTypeItemProps {
  option: DisplayTypeOption;
  isSelected: boolean;
  onSelect: () => void;
}

const DisplayTypeItem: React.FC<DisplayTypeItemProps> = ({ option, isSelected, onSelect }) => {
  return (
    <Card
      onClick={onSelect}
      sx={{
        mb: 2,
        cursor: 'pointer',
        border: isSelected ? 2 : 0,
        borderColor: 'primary.main',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
        <CardMedia
          component="img"
          sx={{ width: 80, height: 80, mr: 2 }}
          image={isSelected ? option.selectedImage : option.image}
          alt={option.name}
        />
        <Box>
          <Typography variant="h6">{option.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {option.description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DisplayTypeItem;