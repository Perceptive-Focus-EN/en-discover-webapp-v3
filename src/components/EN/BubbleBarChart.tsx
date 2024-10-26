import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Box, Tooltip, Typography, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { format, parseISO, getYear, isValid, startOfWeek, addDays, getDaysInMonth } from 'date-fns';
import { Emotion } from './types/emotions';
import { MoodHistoryItem, TimeRange } from './types/moodHistory';
import { EmotionName, EmotionId } from '../Feed/types/Reaction';
import { VOLUME_LEVELS, VolumeLevelId, VolumeLevelName } from './constants/volume';
import { SOURCE_CATEGORIES, SourceCategoryId } from './constants/sources';
import { convertSourceIdsToNames } from './types/moodHistory';

export interface BubbleBarChartProps {
  emotions: Emotion[];
  timeRange: TimeRange;
  history: MoodHistoryItem[];
  selectedVolume: VolumeLevelId | null;
  selectedSource: string | null;
}

export interface BasicChartProps {
  emotions: Emotion[];
}

const CONTAINER_WIDTH = 1000;
const CONTAINER_HEIGHT = 500;
const BUBBLE_SIZE = 20;
const EMOTION_BUBBLE_SIZE = 40;
const Y_AXIS_WIDTH = 100;
const X_AXIS_HEIGHT = 30;
const GRID_WIDTH = CONTAINER_WIDTH - Y_AXIS_WIDTH;
const GRID_HEIGHT = CONTAINER_HEIGHT - X_AXIS_HEIGHT;
const INITIAL_INTERVALS = 10;
const CONTAINER_PADDING = 20;

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

const BubbleBarChart: React.FC<BubbleBarChartProps> = ({
  emotions,
  history = [], // Provide default empty array
  timeRange }) => {
  const theme = useTheme();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [intervalCount, setIntervalCount] = useState(INITIAL_INTERVALS);
  const svgRef = useRef<SVGSVGElement>(null);

  const getDateFormat = (range: TimeRange): string => {
    switch (range) {
      case 'day': return 'HH:mm';
      case 'week': return 'EEE';
      case 'month': return 'd MMM';
      case 'year': return 'MMM';
      case 'lifetime': return 'yyyy';
    }
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  const getFormattedDate = (item: MoodHistoryItem, dateFormat: string): string => {
    const date = item.timeStamp ? parseISO(item.timeStamp) : parseISO(item.date);
    return isValid(date) ? format(date, dateFormat) : 'Invalid Date';
  };

  const filteredHistory = timeRange === 'year'
    ? history.filter(item => {
      const date = item.timeStamp ? parseISO(item.timeStamp) : parseISO(item.date);
      return isValid(date) && getYear(date) === selectedYear;
      })
    : history;

  const years = Array.from(new Set(history.map(item => {
    const date = item.timeStamp ? parseISO(item.timeStamp) : parseISO(item.date);
    return isValid(date) ? getYear(date) : null;
  }).filter((year): year is number => year !== null))).sort((a, b) => b - a);

  // Add this useEffect to handle timeRange changes
  useEffect(() => {
    setIntervalCount(INITIAL_INTERVALS); // Reset interval count when timeRange changes
  }, [timeRange]);

  // Update getTimeIntervals to be more dynamic
  const getTimeIntervals = useCallback((): (string | number)[] => {
    const now = new Date();
    
    switch (timeRange) {
      case 'day':
        return Array.from({ length: 24 }, (_, i) => 
          format(new Date(now.setHours(i, 0, 0, 0)), 'HH:mm')
        );
      
      case 'week':
        const weekStart = startOfWeek(now);
        return Array.from({ length: 7 }, (_, i) => 
          format(addDays(weekStart, i), 'EEE')
        );
      
      case 'month':
        const daysInMonth = getDaysInMonth(now);
        return Array.from({ length: daysInMonth }, (_, i) => 
          format(new Date(now.getFullYear(), now.getMonth(), i + 1), 'd MMM')
        );
      
      case 'year':
        return Array.from({ length: 12 }, (_, i) => 
          format(new Date(now.getFullYear(), i), 'MMM')
        );
      
      case 'lifetime':
        return years.length > 0 ? years : [now.getFullYear()];
      
      default:
        return [];
    }
  }, [timeRange, years]);

  // Update the timeIntervals calculation
  const timeIntervals = useMemo(() => {
    const intervals = getTimeIntervals();
    return intervals.slice(0, Math.min(intervalCount, intervals.length));
  }, [getTimeIntervals, intervalCount]);

  const emotionSpacing = (GRID_HEIGHT - 2 * CONTAINER_PADDING) / (emotions.length + 1);
  const timeSpacing = (GRID_WIDTH - 2 * CONTAINER_PADDING) / (timeIntervals.length + 1);

  const handleScroll = () => {
    if (svgRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = svgRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        setIntervalCount(prevCount => prevCount + INITIAL_INTERVALS);
      }
    }
  };

  useEffect(() => {
    const svgElement = svgRef.current;
    if (svgElement) {
      svgElement.addEventListener('scroll', handleScroll);
      return () => {
        svgElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return (
    <Box sx={{ width: '100%', height: CONTAINER_HEIGHT, overflowX: 'auto', position: 'relative' }}>
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
      <svg
        ref={svgRef}
        width={CONTAINER_WIDTH}
        height={CONTAINER_HEIGHT}
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
      >
        {/* Y-axis: Emotions */}
        <g transform={`translate(${CONTAINER_PADDING}, ${X_AXIS_HEIGHT + CONTAINER_PADDING})`}>
          {emotions.map((emotion, index) => (
            <g key={emotion.id} transform={`translate(0, ${index * emotionSpacing})`}>
              <circle
                cx={Y_AXIS_WIDTH - EMOTION_BUBBLE_SIZE / 2 - 5}
                cy={emotionSpacing / 2}
                r={EMOTION_BUBBLE_SIZE / 2}
                fill={emotion.color}
              />
              <text
                x={Y_AXIS_WIDTH - EMOTION_BUBBLE_SIZE - 10}
                y={emotionSpacing / 2}
                fontSize={12}
                textAnchor="end"
                dominantBaseline="middle"
                fill={theme.palette.text.primary}
              >
                {emotion.emotionName.length > 10 ? `${emotion.emotionName.slice(0, 10)}...` : emotion.emotionName}
              </text>
            </g>
          ))}
        </g>

        {/* X-axis: Time Intervals */}
        <g transform={`translate(${Y_AXIS_WIDTH + CONTAINER_PADDING}, ${GRID_HEIGHT + X_AXIS_HEIGHT + CONTAINER_PADDING})`}>
          {timeIntervals.map((interval, index) => {
            const x = index * timeSpacing + timeSpacing / 2;
            return (
              <text
                key={index}
                x={x}
                y={20}
                fontSize={12}
                textAnchor="middle"
                fill={theme.palette.text.primary}
                transform={timeRange === 'month' ? `rotate(45, ${x}, 20)` : undefined}
              >
                {interval.toString()}
              </text>
            );
          })}
        </g>

        {/* Grid lines */}
        <g transform={`translate(${Y_AXIS_WIDTH + CONTAINER_PADDING}, ${X_AXIS_HEIGHT + CONTAINER_PADDING})`}>
          {/* Vertical grid lines */}
          {timeIntervals.map((_, index) => (
            <line
              key={`v-${index}`}
              x1={index * timeSpacing}
              y1={0}
              x2={index * timeSpacing}
              y2={GRID_HEIGHT - 2 * CONTAINER_PADDING}
              stroke={theme.palette.divider}
              strokeWidth={0.5}
            />
          ))}
          {/* Horizontal grid lines */}
          {emotions.map((_, index) => (
            <line
              key={`h-${index}`}
              x1={0}
              y1={index * emotionSpacing}
              x2={GRID_WIDTH - 2 * CONTAINER_PADDING}
              y2={index * emotionSpacing}
              stroke={theme.palette.divider}
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* Data points */}
        <g transform={`translate(${Y_AXIS_WIDTH + CONTAINER_PADDING}, ${X_AXIS_HEIGHT + CONTAINER_PADDING})`}>
          {emotions.map((emotion, emotionIndex) => (
            timeIntervals.map((_, timeIndex) => {
              const historyItem = filteredHistory.find(item => {
                const itemDate = item.timeStamp ? parseISO(item.timeStamp) : parseISO(item.date);
                const formattedItemDate = isValid(itemDate) ? format(itemDate, getDateFormat(timeRange)) : '';
                return (
                  item.emotionId === emotion.id &&
                  formattedItemDate === timeIntervals[timeIndex].toString()
                );
              });
              return (
                <Tooltip
                  key={`${emotion.id}-${timeIndex}`}
                  title={
                    historyItem ? (
                      <React.Fragment>
                        <Typography color="inherit">
                          {getFormattedDate(historyItem, 'MMM d, yyyy HH:mm')}
                        </Typography>
                        <Typography color="inherit">Volume: {getVolumeName(historyItem.volume)}</Typography>
                        <Typography color="inherit">
                          Sources: {convertSourceIdsToNames(historyItem.sources as SourceCategoryId[]).join(', ')}
                        </Typography>
                      </React.Fragment>
                    ) : 'No data'
                  }
                >
                  <circle
                    cx={timeIndex * timeSpacing + timeSpacing / 2}
                    cy={emotionIndex * emotionSpacing + emotionSpacing / 2}
                    r={BUBBLE_SIZE / 2}
                    fill={historyItem ? emotion.color : 'transparent'}
                    stroke={emotion.color}
                    strokeWidth={1}
                    opacity={historyItem ? volumeToOpacity[historyItem.volume] : 1}
                  />
                </Tooltip>
              );
            })
          ))}
        </g>
      </svg>
    </Box>
  );
};

export default BubbleBarChart;
