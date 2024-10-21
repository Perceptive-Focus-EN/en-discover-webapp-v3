import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidHexColor } from '../types/colorPalette';
import { createGradient } from '../../../utils/colorUtils';
import { Emotion } from '../types/emotions';
import EmotionVolumeDrawer from '../EmotionVolumeDrawer';
import { VOLUME_LEVELS, VolumeLevelId } from '../constants/volume';
import { MoodEntry } from '../types/moodHistory';
import { SourceCategoryId } from '../constants/sources';
import { frontendLogger } from '@/utils/ErrorHandling/frontendLogger';

interface EmotionDisplayProps {
    onEmotionSelect: (moodEntry: Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    emotions: Emotion[];
    tenantId: string;
}

interface SelectedEmotion extends Emotion {
    rect: DOMRect;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ onEmotionSelect, emotions }) => {
    const theme = useTheme();
    const [selectedEmotion, setSelectedEmotion] = useState<SelectedEmotion | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    const getBackgroundColor = useCallback((color: string | string[] | undefined) => {
        if (color) {
            if (Array.isArray(color)) {
                return createGradient(color as ValidHexColor[]);
            } else {
                return color;
            }
        }
        return 'transparent';
    }, []);

    const getTextColor = useCallback((color: string | string[] | undefined): string => {
        if (!color) return 'inherit';
        let colorToUse: string = Array.isArray(color) ? color[0] : color;
        const rgb = hexToRgb(colorToUse);
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }, []);

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const handleEmotionClick = useCallback((emotion: Emotion, index: number) => {
        const bubble = bubbleRefs.current[index];
        if (bubble) {
            const rect = bubble.getBoundingClientRect();
            setSelectedEmotion({ ...emotion, rect });
            setDrawerOpen(true);
        }
    }, []);

    const handleDrawerClose = useCallback(() => {
        setDrawerOpen(false);
    }, []);

    const handleEmotionComplete = useCallback(async (volume: VolumeLevelId, sources: SourceCategoryId[]) => {
        if (selectedEmotion) {
            const volumeLevel = VOLUME_LEVELS.find(level => level.id === volume);
            if (!volumeLevel) {
                frontendLogger.error(
                    new Error('Invalid volume level'),
                    'An error occurred while saving your mood. Please try again.',
                    { volume, sources }
                );
                throw new Error('Invalid volume level');
            }

            const moodEntry: Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'> = {
                tenantId: '', // This should be set by the parent component or context
                emotionId: selectedEmotion.id,
                color: Array.isArray(selectedEmotion.color) ? selectedEmotion.color[0] : selectedEmotion.color,
                sources: sources.map(source => parseInt(source.toString(), 10) as SourceCategoryId),
                date: new Date().toISOString(),
                volume: volume,
            };

            frontendLogger.info(
                'Submitting mood entry',
                'Saving your mood...',
                { moodEntry }
            );

            try {
                await onEmotionSelect(moodEntry);
                frontendLogger.info(
                    'Mood entry submitted successfully',
                    'Your mood has been saved!',
                    { moodEntry }
                );
            } catch (error) {
                frontendLogger.error(
                    error as Error,
                    'Failed to save your mood. Please try again.',
                    { moodEntry }
                );
                // You might want to show an error message to the user here
            }

            handleDrawerClose();
        }
    }, [selectedEmotion, onEmotionSelect, handleDrawerClose]);

    return (
        <>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                    gap: theme.spacing(2),
                    justifyContent: 'center',
                    mb: 4,
                }}
            >
                {emotions.map((emotion, index) => {
                    const backgroundColor = getBackgroundColor(emotion.color);
                    const textColor = getTextColor(emotion.color);
                    return (
                        <motion.div
                            key={emotion.id}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Paper
                                ref={(el) => { bubbleRefs.current[index] = el; }}
                                elevation={3}
                                onClick={() => handleEmotionClick(emotion, index)}
                                sx={{
                                    aspectRatio: '1 / 1',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    background: backgroundColor,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{
                                        color: textColor,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.75rem',
                                        padding: '4px',
                                    }}
                                >
                                    {emotion.emotionName}
                                </Typography>
                            </Paper>
                        </motion.div>
                    );
                })}
            </Box>
            <AnimatePresence>
                {drawerOpen && selectedEmotion && (
                    <EmotionVolumeDrawer
                        open={drawerOpen}
                        onClose={handleDrawerClose}
                        emotion={selectedEmotion}
                        onComplete={handleEmotionComplete}
                        bubblePosition={{
                            left: selectedEmotion.rect.left,
                            top: selectedEmotion.rect.top,
                            width: selectedEmotion.rect.width,
                            height: selectedEmotion.rect.height,
                        }}
                        backgroundColor={getBackgroundColor(selectedEmotion.color)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default EmotionDisplay;