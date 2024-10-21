// src/components/EN/EmotionSelection/EmotionBubble.tsx

import React, { useCallback, useEffect, useRef } from 'react';
import { useDrag, DragPreviewImage } from 'react-dnd';
import { Box, useTheme } from '@mui/material';
import { ValidHexColor } from '../types/colorPalette';

type ColorType = ValidHexColor | ValidHexColor[];

interface EmotionBubbleProps {
  id: string;
  color: ColorType;
  onClick?: () => void;
}

const EmotionBubble: React.FC<EmotionBubbleProps> = ({ id, color }) => {
  const theme = useTheme();

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'emotionBubble',
    item: { id, color },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Create a circular drag preview
  useEffect(() => {
    let svgContent;
    if (Array.isArray(color)) {
      // Handle gradient color
      const [startColor, endColor] = color;
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${startColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${endColor};stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="40" fill="url(#grad)" />
        </svg>
      `;
    } else {
      // Handle single color
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
          <circle cx="40" cy="40" r="40" fill="${color}" />
        </svg>
      `;
    }

    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    img.onload = () => preview(img);
  }, [color, preview]);

  // Combine the drag ref with the Box ref
  const boxRef = useRef<HTMLDivElement>(null);
  const setRefs = useCallback(
    (instance: HTMLDivElement | null) => {
      drag(instance);
      if (instance) {
        // Perform any additional logic here if necessary
      }
    },
    [drag]
  );

  return (
    <>
      <DragPreviewImage connect={preview} src="" />
      <Box
        ref={setRefs}
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: Array.isArray(color)
            ? `linear-gradient(to bottom, ${color[0]}, ${color[1]})`
            : color,
          cursor: 'move',
          transition: 'all 0.3s ease',
          opacity: isDragging ? 0.5 : 1,
          boxShadow: theme.shadows[3],
          '&:hover': {
            opacity: 0.8,
            boxShadow: theme.shadows[5],
            transform: 'scale(1.05)',
          },
        }}
      />
    </>
  );
};

export default EmotionBubble;