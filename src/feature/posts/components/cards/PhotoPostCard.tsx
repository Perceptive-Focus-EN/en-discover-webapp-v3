// src/features/posts/components/cards/PhotoPostCard.tsx
import React, { useState } from 'react';
import { BaseCard } from './BaseCard';
import { PhotoContent, PostType } from '../../api/types';
import { BaseCardProps } from '../factory/types';
import { Box, Typography, IconButton } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import Swipe from 'react-easy-swipe';

interface PhotoPostCardProps extends BaseCardProps {
  type: Extract<PostType, 'PHOTO'>;
  content: PhotoContent;
  media?: { urls: string[]; thumbnails?: string[] };
}

export const PhotoPostCard: React.FC<PhotoPostCardProps> = ({
  content,
  media,
  ...baseProps
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const photos = content.photos || media?.urls || [];
  const maxSteps = photos.length;

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSwipeLeft = () => {
    if (activeStep < maxSteps - 1) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleSwipeRight = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  return (
    <BaseCard {...baseProps}>
      <Box sx={{ position: 'relative' }}>
        <Swipe
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          tolerance={50}
          style={{
            width: '100%',
            display: 'flex',
            overflow: 'hidden'
          }}
        >
          {photos.map((photo, index) => (
            <Box
              key={index}
              component="img"
              sx={{
                width: '100%',
                display: 'block',
                maxHeight: '80vh',
                overflow: 'hidden',
                objectFit: 'contain',
                backgroundColor: 'black',
                flexShrink: 0,
                transform: `translateX(-${activeStep * 100}%)`
              }}
              src={photo}
              alt={`Photo ${index + 1}`}
            />
          ))}
        </Swipe>

        {maxSteps > 1 && (
          <>
            <IconButton
              size="large"
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              <KeyboardArrowLeft />
            </IconButton>
            <IconButton
              size="large"
              onClick={handleNext}
              disabled={activeStep === maxSteps - 1}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              <KeyboardArrowRight />
            </IconButton>
          </>
        )}

        {content.caption && (
          <Typography
            variant="body2"
            sx={{
              p: 2,
              textAlign: content.alignment || 'left',
              fontWeight: content.fontWeight || 'normal',
              fontSize: {
                small: '0.875rem',
                medium: '1rem',
                large: '1.125rem'
              }[content.fontSize || 'medium']
            }}
          >
            {content.caption}
          </Typography>
        )}
      </Box>
    </BaseCard>
  );
};