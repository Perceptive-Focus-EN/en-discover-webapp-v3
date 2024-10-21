// src/components/EN/PalettePreview.tsx

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ColorPalette, ValidHexColor } from './types/colorPalette';
import { createGradient } from '../../utils/colorUtils';

interface PalettePreviewProps {
  palettes: ColorPalette[];
  onSelect: (palette: ColorPalette) => void;
}

// src/components/EN/PalettePreview.tsx
const PalettePreview: React.FC<PalettePreviewProps> = ({ palettes, onSelect }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {palettes.map((palette) => (
        <Button
          key={palette.id}
          onClick={() => onSelect(palette)}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '8px',
            width: '100%',
          }}
        >
          <Typography variant="body2">{palette.paletteName}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {palette.colors.slice(0, 4).map((color, index) => (
              <Box
                key={index}
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: Array.isArray(color)
                    ? createGradient(color as ValidHexColor[])
                    : color as ValidHexColor,
                  boxShadow: '0 0 2px rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </Box>
        </Button>
      ))}
    </Box>
  );
};

export default PalettePreview;