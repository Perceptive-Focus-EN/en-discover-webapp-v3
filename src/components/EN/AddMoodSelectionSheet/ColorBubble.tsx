// ColorBubble.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { convertTailwindToHex } from '../../../utils/colorUtils';

interface ColorBubbleProps {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}

const ColorBubble: React.FC<ColorBubbleProps> = ({ color, onClick, children }) => {
  const [fromColor, toColor] = color.split(', ');

  const fromColorCSS = convertTailwindToHex(fromColor);
  const toColorCSS = convertTailwindToHex(toColor);

  return (
    <Box
      onClick={onClick}
      sx={{
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: `linear-gradient(to bottom, ${fromColorCSS}, ${toColorCSS})`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        boxShadow: 3,
        '&:hover': {
          transform: 'scale(1.05)',
          transition: 'transform 0.3s ease-in-out',
        },
      }}
    >
      <Typography sx={{
        color: 'white',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        fontFamily: 'Nunito, sans-serif',
        lineHeight: 1.5,
        textAlign: 'center',
      }}>
        {children}
      </Typography>
    </Box>
  );
};

export default ColorBubble;