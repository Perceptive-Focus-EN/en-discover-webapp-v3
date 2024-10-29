
import React from 'react';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, Paper, Chip, useTheme } from '@mui/material';
import { Emotion } from './types/emotions';
import { SOURCE_CATEGORIES, SourceCategoryId, SourceCategoryName } from './constants/sources';
import { VOLUME_LEVELS, VolumeLevelId, VolumeLevelName } from './constants/volume';
import { MoodHistoryItem, TimeRange, convertSourceIdsToNames } from './types/moodHistory';
import { EmotionName, EmotionId, EmotionType } from '../../feature/types/Reaction';

interface MoodHistoryChartProps {
  emotion: Emotion;
  history: MoodHistoryItem[];
  timeRange: TimeRange;
}

interface AggregatedData {
  date: string;
  volume: VolumeLevelId;
  sources: string[];
}

const MoodHistoryChart: React.FC<MoodHistoryChartProps> = ({ emotion, history, timeRange }) => {
  const theme = useTheme();
 
const aggregateData = (data: MoodHistoryItem[]): AggregatedData[] => {
  const aggregated = data.reduce((acc, item) => {
      let key: string;
      const date = parseISO(item.date);
      switch (timeRange) {
        case 'day':
          key = format(date, 'HH:mm');
          break;
        case 'week':
          key = format(date, 'EEE');
          break;
        case 'month':
          key = format(date, 'd');
          break;
        case 'year':
          key = format(date, 'MMM');
          break;
        case 'lifetime':
          key = format(date, 'yyyy');
          break;
        default:
          key = item.date;
      }

    if (!acc[key]) {
      acc[key] = { count: 0, totalVolume: 0, sources: new Set<string>() };
    }
    acc[key].count += 1;
    acc[key].totalVolume += item.volume;
    item.sources.forEach(source => acc[key].sources.add(String(source)));
    return acc;
  }, {} as Record<string, { count: number; totalVolume: number; sources: Set<string> }>);

  return Object.entries(aggregated).map(([key, value]) => ({
    date: key,
    volume: Math.round(value.totalVolume / value.count) as VolumeLevelId,
    sources: Array.from(value.sources)
  }));
};

  const chartData = aggregateData(history);

  const getXAxisTickFormatter = () => {
    switch (timeRange) {
      case 'day':
      case 'week':
      case 'month':
      case 'year':
      case 'lifetime':
        return (tick: string) => tick;
      default:
        return (tick: string) => format(new Date(tick), 'MMM d');
    }
  };

    const getVolumeName = (id: VolumeLevelId): VolumeLevelName => {
    const volumeLevel = VOLUME_LEVELS.find(level => level.id === id);
    return volumeLevel ? volumeLevel.name : VOLUME_LEVELS[0].name; // Default to the first level if not found
  };

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as AggregatedData;
    const sourceNames = convertSourceIdsToNames(data.sources as unknown as SourceCategoryId[]);
    return (
      <Paper elevation={3} sx={{ p: 2, maxWidth: 300 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="h6" color={emotion.color}>
          {getVolumeName(data.volume)}
        </Typography>
        {sourceNames.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">Sources:</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {sourceNames.map((source: string, idx: number) => (
                <Chip
                  key={idx}
                  label={source}
                  size="small"
                  sx={{
                    bgcolor: `${emotion.color}22`,
                    color: emotion.color,
                    '& .MuiChip-label': { fontSize: '0.675rem' },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    );
  }
  return null;
  };

  return (
    <Box sx={{ width: '100%', height: 400, p: 2 }}>
      <Typography variant="h6" gutterBottom>{emotion.emotionName} Mood History</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={getXAxisTickFormatter()}
          />
          <YAxis
            domain={[1, 4]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={(tick) => getVolumeName(tick as VolumeLevelId)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="volume"
            stroke={emotion.color}
            strokeWidth={2}
            dot={{ r: 6, fill: emotion.color, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8, fill: emotion.color, strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default MoodHistoryChart;