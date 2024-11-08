import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Box, Tooltip, Typography, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { format, parseISO, getYear, isValid, startOfWeek, addDays, getDaysInMonth, isSameDay } from 'date-fns';
import { Emotion } from './types/emotions';
import { MoodHistoryItem, TimeRange } from './types/moodHistory';
import { EmotionName, EmotionId } from '../../feature/types/Reaction';
import { VOLUME_LEVELS, VolumeLevelId, VolumeLevelName } from './constants/volume';
import { SOURCE_CATEGORIES, SourceCategoryId } from './constants/sources';
import { convertSourceIdsToNames } from './types/moodHistory';

// Define getVolumeName function
const getVolumeName = (volumeId: VolumeLevelId): string => {
  const volume = VOLUME_LEVELS.find(v => v.id === volumeId);
  return volume ? volume.name : 'Unknown';
};

interface BubbleData {
  emotion: Emotion;
  x: number;
  y: number;
  size: number;
  intensity: number;
  sources: string[];
  date: Date;
}

interface BubbleBarChartProps {
  emotions: Emotion[];
  timeRange: TimeRange;
  history: Emotion[];
  selectedVolume?: VolumeLevelId | null;
  selectedSource?: string | null;
  onBubbleClick?: (emotion: Emotion) => void;
}

const CONTAINER_WIDTH = 1000;
const CONTAINER_HEIGHT = 500;
const BUBBLE_MIN_SIZE = 20;
const BUBBLE_MAX_SIZE = 40;
const Y_AXIS_WIDTH = 100;
const X_AXIS_HEIGHT = 30;
const GRID_WIDTH = CONTAINER_WIDTH - Y_AXIS_WIDTH;
const GRID_HEIGHT = CONTAINER_HEIGHT - X_AXIS_HEIGHT;
const CONTAINER_PADDING = 20;

const BubbleBarChart: React.FC<BubbleBarChartProps> = ({
  emotions,
  history,
  timeRange,
  selectedVolume,
  selectedSource,
  onBubbleClick
}) => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hoveredBubble, setHoveredBubble] = useState<BubbleData | null>(null);

  // Process emotions data into bubble data
  const bubbleData = useMemo(() => {
    if (!history.length) return [];

    const processedData: BubbleData[] = [];
    const timeIntervals = getTimeIntervals(timeRange, selectedYear);
    const emotionSpacing = (GRID_HEIGHT - 2 * CONTAINER_PADDING) / (emotions.length + 1);

    history.forEach(entry => {
      // Skip if doesn't match filters
      if (selectedVolume && entry.volume !== selectedVolume) return;
      if (selectedSource && !entry.sources.includes(selectedSource)) return;

      const entryDate = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp ?? entry.createdAt ?? Date.now());
      const timeIndex = getTimeIntervalIndex(entryDate, timeRange, timeIntervals);
      
      if (timeIndex === -1) return;

      const emotionIndex = emotions.findIndex(e => e.emotionName === entry.emotionName);
      if (emotionIndex === -1) return;

      const x = Y_AXIS_WIDTH + CONTAINER_PADDING + 
        (timeIndex * ((GRID_WIDTH - 2 * CONTAINER_PADDING) / timeIntervals.length));
      const y = CONTAINER_PADDING + X_AXIS_HEIGHT + 
        (emotionIndex * emotionSpacing) + (emotionSpacing / 2);

      processedData.push({
        emotion: entry,
        x,
        y,
        size: BUBBLE_MIN_SIZE + (entry.volume * ((BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE) / 4)),
        intensity: entry.volume,
        sources: entry.sources,
        date: entryDate
      });
    });

    return processedData;
  }, [emotions, history, timeRange, selectedYear, selectedVolume, selectedSource]);

  // Get time intervals based on range
  const getTimeIntervals = (range: TimeRange, year: number): Date[] => {
    const now = new Date();
    switch (range) {
      case 'day':
        return Array.from({ length: 24 }, (_, i) => new Date(now.setHours(i, 0, 0, 0)));
      case 'week':
        return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(now), i));
      case 'month':
        return Array.from({ length: getDaysInMonth(now) }, (_, i) => 
          new Date(now.getFullYear(), now.getMonth(), i + 1));
      case 'year':
        return Array.from({ length: 12 }, (_, i) => new Date(year, i));
      case 'lifetime':
        const years = Array.from(new Set(history.map(item => {
          const date = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp ?? item.createdAt ?? Date.now());
          return getYear(date);
        }))).sort();
        return years.map(y => new Date(y, 0));
      default:
        return [];
    }
  };

  const getTimeIntervalIndex = (date: Date, range: TimeRange, intervals: Date[]): number => {
    switch (range) {
      case 'day':
        return date.getHours();
      case 'week':
        return date.getDay();
      case 'month':
        return date.getDate() - 1;
      case 'year':
        return date.getMonth();
      case 'lifetime':
        return intervals.findIndex(interval => getYear(interval) === getYear(date));
      default:
        return -1;
    }
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  const renderTooltip = (bubble: BubbleData) => (
    <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="subtitle2">{bubble.emotion.emotionName}</Typography>
      <Typography variant="body2">
        Volume: {getVolumeName(bubble.intensity as VolumeLevelId)}
      </Typography>
      <Typography variant="body2">
        Time: {format(bubble.date, getTimeFormat(timeRange))}
      </Typography>
      {bubble.sources.length > 0 && (
        <Typography variant="body2">
          Sources: {convertSourceIdsToNames(bubble.sources as unknown as SourceCategoryId[]).join(', ')}
        </Typography>
      )}
    </Box>
  );

  const getTimeFormat = (range: TimeRange): string => {
    switch (range) {
      case 'day': return 'HH:mm';
      case 'week': return 'EEE, MMM d';
      case 'month': return 'MMM d';
      case 'year': return 'MMM yyyy';
      case 'lifetime': return 'yyyy';
      default: return 'MMM d, yyyy';
    }
  };

  return (
    <Box sx={{ width: '100%', height: CONTAINER_HEIGHT, position: 'relative' }}>
      {timeRange === 'year' && (
        <Box sx={{ mb: 2 }}>
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            sx={{ minWidth: 120 }}
          >
            {Array.from(new Set(history.map(item => 
              getYear(item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp ?? item.createdAt ?? Date.now()))
            ))).sort().map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </Box>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height={CONTAINER_HEIGHT}
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
        style={{ overflow: 'visible' }}
      >
        {/* Render emotion labels */}
        {emotions.map((emotion, index) => (
          <g key={emotion.id} transform={`translate(0, ${CONTAINER_PADDING + X_AXIS_HEIGHT + index * ((GRID_HEIGHT - 2 * CONTAINER_PADDING) / emotions.length)})`}>
            <text
              x={Y_AXIS_WIDTH - 10}
              y={0}
              textAnchor="end"
              dominantBaseline="middle"
              fill={theme.palette.text.primary}
              fontSize="12"
            >
              {emotion.emotionName}
            </text>
          </g>
        ))}

        {/* Render bubbles */}
        {bubbleData.map((bubble, index) => (
          <g key={index}>
            <circle
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.size / 2}
              fill={bubble.emotion.color}
              opacity={0.7}
              cursor="pointer"
              onClick={() => onBubbleClick?.(bubble.emotion)}
              onMouseEnter={() => setHoveredBubble(bubble)}
              onMouseLeave={() => setHoveredBubble(null)}
            />
            {hoveredBubble === bubble && (
              <foreignObject
                x={bubble.x + bubble.size/2}
                y={bubble.y - bubble.size/2}
                width={200}
                height={100}
              >
                {renderTooltip(bubble)}
              </foreignObject>
            )}
          </g>
        ))}

        {/* Render time axis */}
        {getTimeIntervals(timeRange, selectedYear).map((interval, index) => (
          <text
            key={index}
            x={Y_AXIS_WIDTH + CONTAINER_PADDING + index * ((GRID_WIDTH - 2 * CONTAINER_PADDING) / getTimeIntervals(timeRange, selectedYear).length)}
            y={CONTAINER_HEIGHT - 10}
            textAnchor="middle"
            fill={theme.palette.text.primary}
            fontSize="12"
          >
            {format(interval, getTimeFormat(timeRange))}
          </text>
        ))}
      </svg>
    </Box>
  );
};

export default BubbleBarChart;