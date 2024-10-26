import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BaseCard, BaseCardProps } from './BaseCard';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import LoopIcon from '@mui/icons-material/Loop';
import useFeedOperations from '../context/useFeedOperations';

export interface VideoCardProps extends BaseCardProps {
  blobName?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: string;
  caption?: string;
  processingStatus: 'queued' | 'processing' | 'completed' | 'failed' | 'pending' | 'unavailable';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  blobName,
  videoUrl: initialVideoUrl,
  thumbnailUrl,
  duration,
  caption,
  processingStatus,
  autoplay = false,
  muted = true,
  loop = false,
  ...baseProps
}) => {
  const { getVideoUrl } = useFeedOperations(); // Import from useFeedOperations
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLooping, setIsLooping] = useState(loop);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl || null);
  const [loading, setLoading] = useState(!initialVideoUrl && processingStatus !== 'completed');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch video URL based on blobName if processing is complete
  useEffect(() => {
    const fetchVideoUrl = async () => {
      if (initialVideoUrl) {
        setVideoUrl(initialVideoUrl);
        setLoading(false);
      } else if (blobName && processingStatus === 'completed') {
        try {
          setLoading(true);
          const url = await getVideoUrl(blobName);
          setVideoUrl(url);
          setError(null);
        } catch (err) {
          setError('Unable to load video');
          setVideoUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [blobName, initialVideoUrl, processingStatus, getVideoUrl]);

  // Play/Pause toggle function
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          setError('Unable to play video. Please try again.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Mute/Unmute toggle function
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Loop toggle function
  const toggleLoop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  }, [isLooping]);

  // Handle video playback errors
  const handleVideoError = () => {
    setError('Video playback error');
  };

  return (
    <BaseCard {...baseProps}>
      <Box sx={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
        {loading ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        ) : videoUrl ? (
          <>
            <Box
              component="video"
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              autoPlay={autoplay}
              muted={muted}
              loop={loop}
              onError={handleVideoError}
              controls
            />
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                px: 1,
                py: 0.5,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 1,
                color: 'white',
                fontSize: 12,
              }}
            >
              {duration}
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <Box>
                <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <IconButton onClick={toggleLoop} sx={{ color: isLooping ? 'primary.main' : 'white' }}>
                  <LoopIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            {['queued', 'processing', 'pending'].includes(processingStatus) ? (
              <>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2">
                  {processingStatus === 'pending' ? 'Video processing pending...' : 'Video is being processed...'}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">
                {processingStatus === 'failed' ? 'Video processing failed' : 'Video unavailable'}
              </Typography>
            )}
          </Box>
        )}
      </Box>
      {caption && (
        <Typography sx={{ px: 2, py: 1.5, fontSize: 14, color: 'text.secondary' }}>
          {caption}
        </Typography>
      )}
    </BaseCard>
  );
};
