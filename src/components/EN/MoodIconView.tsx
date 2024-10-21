import React, { useState } from 'react';
import { Box, Typography, Tooltip, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { format, parseISO, getYear, isValid } from 'date-fns';
import { VOLUME_LEVELS, VolumeLevelId, VolumeLevelName } from './constants/volume';
import { SOURCE_CATEGORIES, SourceCategoryId } from './constants/sources';
import { MoodHistoryItem, TimeRange, convertSourceIdsToNames } from './types/moodHistory';
import { EmotionName, EmotionId } from '../Feed/types/Reaction';
import { Emotion } from './types/emotions';

interface MoodIconViewProps {
    emotion: Emotion;
    history: MoodHistoryItem[];
    timeRange: TimeRange;
}

export const volumeToOpacity: Record<VolumeLevelId, number> = {
    1: 0.25, // 'A little'
    2: 0.5,  // 'Normal'
    3: 0.75, // 'Enough'
    4: 1,    // 'A lot'
};

const getVolumeName = (id: VolumeLevelId): VolumeLevelName => {
    const volumeLevel = VOLUME_LEVELS.find(level => level.id === id);
    return volumeLevel ? volumeLevel.name : VOLUME_LEVELS[0].name;
};

const MoodIconView: React.FC<MoodIconViewProps> = ({ emotion, history, timeRange }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const getDateFormat = (range: string) => {
        switch (range) {
            case 'day':
                return 'HH:mm';
            case 'week':
                return 'EEE';
            case 'month':
                return 'd MMM';
            case 'year':
            case 'lifetime':
                return 'MMM yyyy';
            default:
                return 'MMM d, yyyy';
        }
    };

    const handleYearChange = (event: SelectChangeEvent<number>) => {
        setSelectedYear(event.target.value as number);
    };

    const filteredHistory = timeRange === 'year'
    ? history.filter(item => getYear(parseISO(item.timeStamp)) === selectedYear)
    : history;

    const years = Array.from(new Set(history.map(item => getYear(parseISO(item.timeStamp))))).sort((a, b) => b - a);

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Typography variant="h6" gutterBottom>{emotion.emotionName} Mood History</Typography>
            {timeRange === 'year' && (
                <Box sx={{ mb: 2 }}>
                    <Select
                        value={selectedYear}
                        onChange={handleYearChange}
                        sx={{ minWidth: 120 }}
                    >
                        {years.map((year) => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                    </Select>
                </Box>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                {filteredHistory.map((item, index) => {
                    const size = 32; // Fixed size for all circles
                    const opacity = volumeToOpacity[item.volume] || 0.5;
                    const itemDate = parseISO(item.timeStamp);
                    const sourceNames = convertSourceIdsToNames(item.sources as unknown as SourceCategoryId[]);
                    return isValid(itemDate) ? (
                        <Tooltip
                            key={index}
                            title={
                                <React.Fragment>
                                    <Typography color="inherit">{format(itemDate, 'MMM d, yyyy HH:mm')}</Typography>
                                    <Typography color="inherit">Volume: {getVolumeName(item.volume)}</Typography>
                                    {sourceNames.length > 0 && (
                                        <Typography color="inherit">Sources: {sourceNames.join(', ')}</Typography>
                                    )}
                                </React.Fragment>
                            }
                            arrow
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        width: size,
                                        height: size,
                                        borderRadius: '50%',
                                        backgroundColor: emotion.color,
                                        opacity: opacity,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                        },
                                    }}
                                />
                                <Typography variant="caption">{format(itemDate, getDateFormat(timeRange))}</Typography>
                            </Box>
                        </Tooltip>
                    ) : null;
                })}
            </Box>
        </Box>
    );
};

export default MoodIconView;