import React, { useState, useEffect, useCallback } from 'react';
import {
    SwipeableDrawer,
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    IconButton,
    useTheme,
    Slider,
    useMediaQuery,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { Emotion } from './types/emotions';
import { useMoodBoard } from '../../contexts/MoodBoardContext';
import { SOURCE_CATEGORIES, SourceCategoryId } from './constants/sources';
import { VOLUME_LEVELS, VolumeLevelId } from './constants/volume';
import { frontendLogger } from '@/utils/ErrorHandling/frontendLogger';

interface EmotionVolumeDrawerProps {
    open: boolean;
    onClose: () => void;
    emotion: Emotion | null;
    onComplete: (volume: VolumeLevelId, sources: SourceCategoryId[]) => void;
    bubblePosition: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    backgroundColor: string;
    isLoading?: boolean;
    error?: string | null;
}

const EmotionVolumeDrawer: React.FC<EmotionVolumeDrawerProps> = ({
  open,
  onClose,
  emotion,
  onComplete,
  bubblePosition,
 backgroundColor,
  isLoading = false,
 error = null,
}) => {
    const theme = useTheme();
    const { saveMoodEntry} = useMoodBoard();

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    interface VolumeState {
        volume: VolumeLevelId;
        selectedSource: SourceCategoryId[];
        backgroundOpacity: number;
    }

    const [state, setState] = useState<VolumeState>({
        volume: VOLUME_LEVELS[0].id,
        selectedSource: [] as SourceCategoryId[],
        backgroundOpacity: 0.25,
    });

    useEffect(() => {
        setState((prevState) => ({
            ...prevState,
            backgroundOpacity: ((prevState.volume - 1) / 3) * 0.75 + 0.25,
        }));
    }, [state.volume]);

    const handleVolumeChange = useCallback((_event: Event, newValue: number | number[]) => {
        setState((prevState) => ({ ...prevState, volume: newValue as VolumeLevelId }));
    }, []);

    const handleSourceToggle = useCallback((sourceId: SourceCategoryId) => {
        setState((prevState) => ({
            ...prevState,
            selectedSource: prevState.selectedSource.includes(sourceId)
                ? prevState.selectedSource.filter((id) => id !== sourceId)
                : [...prevState.selectedSource, sourceId],
        }));
    }, []);

      const handleComplete = useCallback(async () => {
    if (state.selectedSource.length === 0 || !emotion) {
      frontendLogger.warn(
        'Attempted to complete emotion selection without source or emotion',
        'Please select at least one source and an emotion.',
        { selectedSources: state.selectedSource, emotion }
      );
      alert("Please select at least one source and an emotion.");
      return;
    }

    try {
      const volumeLevel = VOLUME_LEVELS.find(level => level.id === state.volume);
      if (!volumeLevel) {
        throw new Error('Invalid volume level');
      }

      frontendLogger.info(
        'Completing emotion selection',
        'Submitting your mood entry...',
        { emotion, volume: state.volume, sources: state.selectedSource }
      );

      // We're now passing the volume id (VolumeLevelId) directly to onComplete
      onComplete(state.volume, state.selectedSource);
      onClose();
    } catch (error) {
      frontendLogger.error(
        error as Error,
        'Failed to save your mood entry. Please try again.',
        { emotion, volume: state.volume, sources: state.selectedSource }
      );
      console.error('Failed to save mood entry:', error);
    }
  }, [state, emotion, onComplete, onClose]);

    const drawerVariants = {
        initial: { 
            scale: 0, 
            x: bubblePosition.left + bubblePosition.width / 2 - window.innerWidth / 2,
            y: bubblePosition.top + bubblePosition.height / 2 - window.innerHeight / 2,
            borderRadius: '50%',
        },
        animate: { 
            scale: 1, 
            x: 0, 
            y: 0,
            borderRadius: 0,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 30,
            }
        },
        exit: { 
            scale: 0, 
            x: bubblePosition.left + bubblePosition.width / 2 - window.innerWidth / 2,
            y: bubblePosition.top + bubblePosition.height / 2 - window.innerHeight / 2,
            borderRadius: '50%',
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 30,
            }
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <SwipeableDrawer
                    anchor="bottom"
                    open={open}
                    onClose={onClose}
                    onOpen={() => {}}
                    disableSwipeToOpen
                    PaperProps={{
                        sx: {
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            overflow: 'hidden',
                            background: 'transparent',
                            boxShadow: 'none',
                        },
                    }}
                >
                    <motion.div
                        variants={drawerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: backgroundColor,
                            opacity: state.backgroundOpacity,
                            zIndex: theme.zIndex.drawer - 1,
                            transition: 'opacity 0.3s ease',
                        }}
                    />
                    <Box
                        sx={{
                            height: '70vh',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            color: 'white',
                            zIndex: theme.zIndex.drawer,
                        }}
                    >
                        <IconButton
                            onClick={onClose}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: 'white',
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h5" gutterBottom>
                            {emotion?.emotionName || 'Select an Emotion'}
                        </Typography>
                        <Typography variant="h4" gutterBottom>
                            How intense is this feeling?
                        </Typography>
                        <Typography variant="subtitle1">
                            Select one or several sources of your current mood state,
                            <br />
                            and the volume of your emotion.
                        </Typography>
                    </Box>

                    <Paper
                        elevation={3}
                        sx={{
                            flex: 1,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            overflow: 'hidden',
                            position: 'relative',
                            mt: -2,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            zIndex: theme.zIndex.drawer,
                        }}
                    >
                        <Box sx={{ p: 3, pt: 5, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', width: '100%' }}>
                            <Box sx={{ position: 'relative', mb: 4, px: isMobile ? 1 : 4, width: '100%' }}>
                                <Slider
                                    value={state.volume}
                                    onChange={handleVolumeChange}
                                    step={null}
                                    marks={VOLUME_LEVELS.map(level => ({ value: level.id, label: level.name }))}
                                    min={VOLUME_LEVELS[0].id}
                                    max={VOLUME_LEVELS[VOLUME_LEVELS.length - 1].id}
                                    sx={{
                                        '& .MuiSlider-thumb': {
                                            width: isMobile ? 40 : 56,
                                            height: isMobile ? 40 : 56,
                                            backgroundColor: backgroundColor,
                                            border: '2px solid white',
                                            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                                            '&:before': {
                                                content: '"\\2630"',
                                                color: 'white',
                                                fontSize: isMobile ? '18px' : '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            },
                                        },
                                        '& .MuiSlider-rail': {
                                            opacity: 0.3,
                                            backgroundColor: theme.palette.grey[300],
                                        },
                                        '& .MuiSlider-track': {
                                            backgroundColor: backgroundColor,
                                            opacity: state.backgroundOpacity,
                                        },
                                        '& .MuiSlider-mark': {
                                            backgroundColor: 'transparent',
                                        },
                                        '& .MuiSlider-markLabel': {
                                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                                            fontWeight: 500,
                                            top: isMobile ? 32 : 40,
                                            color: theme.palette.text.secondary,
                                            '&.Mui-active': {
                                                color: theme.palette.text.primary,
                                                fontWeight: 700,
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', my: 4 }}>
                                {SOURCE_CATEGORIES.map((source) => (
                                    <Chip
                                        key={source.id}
                                        label={source.name}
                                        onClick={() => handleSourceToggle(source.id)}
                                        color={state.selectedSource.includes(source.id) ? 'primary' : 'default'}
                                        sx={{
                                            borderRadius: '50px',
                                            height: 'auto',
                                            border: state.selectedSource.includes(source.id) ? `2px solid ${backgroundColor}` : 'none',
                                            '& .MuiChip-label': { 
                                                px: 2, 
                                                py: 1,
                                                fontSize: state.selectedSource.includes(source.id) ? '1.25rem' : '1rem',
                                                color: state.selectedSource.includes(source.id) ? theme.palette.text.primary : null,
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    />
                                ))}
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleComplete}
                                disabled={state.selectedSource.length === 0 || isLoading}
                                sx={{
                                    mt: 'auto',
                                    bgcolor: backgroundColor,
                                    '&:hover': { 
                                        bgcolor: backgroundColor,
                                        filter: 'brightness(90%)',
                                    },
                                    '&:disabled': {
                                        bgcolor: theme.palette.action.disabledBackground,
                                        color: theme.palette.action.disabled,
                                    },
                                    color: 'white',
                                    borderRadius: 24,
                                    py: 1.5,
                                    transition: 'filter 0.3s ease',
                                }}
                            >
                                {isLoading ? 'Saving...' : 'That is my mood for now'}
                            </Button>
                            {error && (
                                <Typography color="error" sx={{ mt: 2 }}>
                                    {error}
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </SwipeableDrawer>
            )}
        </AnimatePresence>
    );
};

export default EmotionVolumeDrawer;
