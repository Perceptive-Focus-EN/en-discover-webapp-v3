import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidHexColor } from '../types/colorPalette';
import { createGradient } from '../../../utils/colorUtils';
import { Emotion } from '../types/emotions';
import EmotionVolumeDrawer from '../EmotionVolumeDrawer';
import { VOLUME_LEVELS, VolumeLevelId } from '../constants/volume';
import { MoodEntry } from '../types/moodHistory';
import { SourceCategoryId } from '../constants/sources';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface EmotionDisplayProps {
    onEmotionSelect: (moodEntry: Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    emotions: Emotion[];
    tenantId: string;
}

interface SelectedEmotion extends Emotion {
    rect: DOMRect;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = React.memo(({ onEmotionSelect, emotions }) => {
    const theme = useTheme();
    const [selectedEmotion, setSelectedEmotion] = useState<SelectedEmotion | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    const getBackgroundColor = useCallback((color: string | string[] | undefined) => {
        if (!color) return 'transparent';
        return Array.isArray(color) 
            ? createGradient(color as ValidHexColor[])
            : color;
    }, []);

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const getTextColor = useCallback((color: string | string[] | undefined): string => {
        if (!color) return 'inherit';
        const colorToUse: string = Array.isArray(color) ? color[0] : color;
        const rgb = hexToRgb(colorToUse);
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }, []);

    // Pre-calculate colors on emotions change
    useEffect(() => {
        if (emotions.length > 0 && !isReady) {
            bubbleRefs.current = new Array(emotions.length);
            setIsReady(true);
        }
    }, [emotions, isReady]);

    // Memoize color calculations
    const colorCache = useMemo(() => {
        return emotions.reduce<Record<string, { bg: string; text: string }>>((cache, emotion) => ({
            ...cache,
            [emotion.id]: {
                bg: getBackgroundColor(emotion.color),
                text: getTextColor(emotion.color)
            }
        }), {});
    }, [emotions, getBackgroundColor, getTextColor]);

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
        if (!selectedEmotion) return;

        const volumeLevel = VOLUME_LEVELS.find(level => level.id === volume);
        if (!volumeLevel) return;

        const moodEntry: Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'> = {
            tenantId: '',
            emotionId: selectedEmotion.id,
            color: Array.isArray(selectedEmotion.color) ? selectedEmotion.color[0] : selectedEmotion.color,
            sources: sources.map(source => parseInt(source.toString(), 10) as SourceCategoryId),
            date: new Date().toISOString(),
            volume: volume,
        };

        await onEmotionSelect(moodEntry);
        messageHandler.success('Mood recorded successfully');
        handleDrawerClose();
    }, [selectedEmotion, onEmotionSelect, handleDrawerClose]);

    if (!isReady) {
        return null;
    }

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
                    const colors = colorCache[emotion.id];
                    return (
                        <motion.div
                            key={emotion.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
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
                                    background: colors.bg,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{
                                        color: colors.text,
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
});

EmotionDisplay.displayName = 'EmotionDisplay';

export default EmotionDisplay;