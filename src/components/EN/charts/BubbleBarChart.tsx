import React from 'react';
import { Box } from '@mui/material';

interface BubbleBarChartProps {
  isThumbnail?: boolean;
}

const mockEmotions = [
  { name: 'Happy', color: '#FFD700' },
  { name: 'Sad', color: '#1E90FF' },
  { name: 'Angry', color: '#FF4500' },
  { name: 'Surprised', color: '#32CD32' },
  { name: 'Disgusted', color: '#8A2BE2' },
  { name: 'Fearful', color: '#FF69B4' },
];

const BubbleBarChart: React.FC<BubbleBarChartProps> = ({ isThumbnail = false }) => {
  if (!isThumbnail) {
    // Return full chart implementation here
    return <div>Full chart implementation</div>;
  }

  // Thumbnail version
  return (
    <Box
      sx={{
        width: '100%',
        height: '130px', // Increased height to add padding
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 120 130"> {/* Adjusted viewBox height */}
        {/* Background grid */}
        <g stroke="#eee" strokeWidth="0.5">
          {[0, 30, 60, 90, 120].map((position) => (
            <React.Fragment key={position}>
              <line x1={position} y1="0" x2={position} y2="120" />
              <line x1="20" y1={position} x2="120" y2={position} />
            </React.Fragment>
          ))}
        </g>

        {/* Simplified Y-axis */}
        <g transform="translate(0, 10)">
          {mockEmotions.map((emotion, index) => (
            <circle
              key={`y-${emotion.name}`}
              cx="10"
              cy={10 + index * 20}
              r="4"
              fill={emotion.color}
            />
          ))}
        </g>

        {/* Mock data points */}
        {mockEmotions.map((emotion, emotionIndex) => (
          [0, 1, 2, 3, 4].map((timeIndex) => (
            <circle
              key={`${emotion.name}-${timeIndex}`}
              cx={30 + timeIndex * 22}
              cy={20 + emotionIndex * 20}
              r={3 + Math.random() * 3}
              fill={emotion.color}
              opacity={0.3 + Math.random() * 0.7}
            />
          ))
        ))}

        {/* Simplified X-axis */}
        <g transform="translate(30, 110)">
          {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
            <text
              key={day}
              x={index * 22}
              y="10"
              fontSize="8"
              textAnchor="middle"
              fill="#666"
            >
              {day}
            </text>
          ))}
        </g>
      </svg>
    </Box>
  );
};

export default BubbleBarChart;