// src/features/posts/components/cards/VideoPostCard.tsx

import React, { useState, useRef } from 'react';
import { BaseCard } from './BaseCard';
import { VideoContent, PostType } from '../../api/types';
import { BaseCardProps } from '../factory/types';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

interface VideoPostCardProps extends BaseCardProps {
  type: Extract<PostType, 'VIDEO'>;
  content: VideoContent;
  media?: { urls: string[]; thumbnails?: string[] };
}

export const VideoPostCard: React.FC<VideoPostCardProps> = ({
  content,
  media,
  ...baseProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoLoad = () => setIsLoading(false);
  const handleVideoError = () => {
    setError('Failed to load video');
    setIsLoading(false);
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <BaseCard {...baseProps}>
      <Box sx={{ position: 'relative' }}>
        {/* Loading spinner overlay */}
        {isLoading && !error && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Processing state */}
        {content.processingStatus === 'processing' ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography sx={{ mt: 2 }}>Processing video...</Typography>
          </Box>
        ) : (
          <video
            ref={videoRef}
            controls
            poster={content.thumbnailUrl || media?.thumbnails?.[0]}
            style={{
              width: '100%',
              maxHeight: '80vh',
              backgroundColor: 'black',
            }}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
          >
            <source src={content.videoUrl || media?.urls[0]} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        {/* Play/Pause button overlay */}
        {!isLoading && !error && (
          <IconButton
            onClick={togglePlayback}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        )}

        {/* Error message */}
        {error && (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        )}

        {/* Caption */}
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
                large: '1.125rem',
              }[content.fontSize || 'medium'],
            }}
          >
            {content.caption}
          </Typography>
        )}
      </Box>
    </BaseCard>
  );
};
