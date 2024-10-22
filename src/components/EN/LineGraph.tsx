import React, { useState } from 'react';
import { Emotion } from './types/emotions';
import { useTheme } from '@mui/material/styles';

interface LineGraphProps {
  emotions: Emotion[];
}

const LineGraph: React.FC<LineGraphProps> = ({ emotions }) => {
  const theme = useTheme();
  const [hoveredEmotion, setHoveredEmotion] = useState<Emotion | null>(null);

  // Function to generate random y-values (replace this with actual data processing)
  const getRandomY = () => Math.floor(Math.random() * 150) + 25; // Random value between 25 and 175

  // Generate y-values and points for the polyline
  const yValues = emotions.map(() => getRandomY());
  const points = yValues.map((y, i) => `${i * 50},${200 - y}`).join(' ');

  const handleMouseEnter = (emotion: Emotion) => {
    setHoveredEmotion(emotion);
  };

  const handleMouseLeave = () => {
    setHoveredEmotion(null);
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 250 220"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.palette.primary.light} />
          <stop offset="100%" stopColor={theme.palette.primary.dark} />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect x="0" y="0" width="250" height="200" fill={theme.palette.background.paper} rx="10" ry="10" />
      {/* Grid lines */}
      {[0, 50, 100, 150, 200].map(x => (
        <line key={`vertical-${x}`} x1={x} y1="0" x2={x} y2="200" stroke={theme.palette.divider} strokeWidth="1" />
      ))}
      {[0, 50, 100, 150].map(y => (
        <line key={`horizontal-${y}`} x1="0" y1={y} x2="250" y2={y} stroke={theme.palette.divider} strokeWidth="1" />
      ))}
      {/* Polyline */}
      <polyline
        points={points}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))',
          transition: 'all 0.3s ease-in-out',
        }}
      />
      {/* Circles and labels */}
      {emotions.map((emotion, index) => (
        <g
          key={emotion.id}
          onMouseEnter={() => handleMouseEnter(emotion)}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'pointer' }}
        >
          <circle
            cx={index * 50}
            cy={200 - yValues[index]}
            r="6"
            fill={emotion.color || theme.palette.primary.main}
            stroke={theme.palette.background.paper}
            strokeWidth="2"
            style={{
              transition: 'all 0.3s ease-in-out',
              transform: hoveredEmotion === emotion ? 'scale(1.2)' : 'scale(1)',
            }}
          />
          <text
            x={index * 50}
            y="215"
            textAnchor="middle"
            fontSize="10"
            fill={theme.palette.text.primary}
            style={{
              transition: 'all 0.3s ease-in-out',
              fontWeight: hoveredEmotion === emotion ? 'bold' : 'normal',
            }}
          >
            {emotion.emotionName}
          </text>
        </g>
      ))}
      {/* Tooltip */}
      {hoveredEmotion && (
        <g>
          <rect
            x={emotions.findIndex(e => e.id === hoveredEmotion.id) * 50 - 40}
            y={200 - yValues[emotions.findIndex(e => e.id === hoveredEmotion.id)] - 40}
            width="80"
            height="30"
            fill={theme.palette.background.paper}
            stroke={theme.palette.divider}
            strokeWidth="1"
            rx="5"
            ry="5"
          />
          <text
            x={emotions.findIndex(e => e.id === hoveredEmotion.id) * 50}
            y={200 - yValues[emotions.findIndex(e => e.id === hoveredEmotion.id)] - 20}
            textAnchor="middle"
            fontSize="12"
            fill={theme.palette.text.primary}
          >
            {`${hoveredEmotion.emotionName}: ${yValues[emotions.findIndex(e => e.id === hoveredEmotion.id)]}`}
          </text>
        </g>
      )}
    </svg>
  );
};

export default LineGraph;