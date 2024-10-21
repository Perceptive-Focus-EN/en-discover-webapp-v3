// src/components/Feed/cards/TextCard.tsx
import React from 'react';
import { Typography, useTheme } from '@mui/material';
import { BaseCard, BaseCardProps } from './BaseCard';
import { alpha } from '@mui/material/styles';

export interface TextCardProps extends BaseCardProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: 'small' | 'medium' | 'large';
  alignment: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  padding: 'small' | 'medium' | 'large';
  maxLines?: number;
}

const getFontSize = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small': return '1rem';
    case 'medium': return '1.25rem';
    case 'large': return '1.5rem';
  }
};

const getPadding = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small': return '1rem';
    case 'medium': return '1.5rem';
    case 'large': return '2rem';
  }
};

export const TextCard: React.FC<TextCardProps> = (props) => {
  const { 
    text, 
    backgroundColor, 
    textColor, 
    fontSize, 
    alignment, 
    fontWeight, 
    padding, 
    maxLines,
    ...baseProps 
  } = props;

  const theme = useTheme();
  
  const getContrastColor = (bgColor: string) => {
    const rgb = parseInt(bgColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? '#ffffff' : '#000000';
  };

  const contrastColor = getContrastColor(backgroundColor);

  return (
    <BaseCard {...baseProps}>
      <Typography
        variant="body1"
        sx={{
          backgroundColor,
          padding: getPadding(padding),
          minHeight: 100,
          display: '-webkit-box',
          alignItems: 'center',
          justifyContent: alignment,
          position: 'relative',
          color: textColor || contrastColor,
          fontSize: getFontSize(fontSize),
          fontWeight,
          textAlign: alignment,
          wordBreak: 'break-word',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[3],
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(to bottom, ${alpha(backgroundColor, 0)} 80%, ${alpha(backgroundColor, 0.1)} 100%)`,
            pointerEvents: 'none',
          },
        }}
      >
        {text}
      </Typography>
    </BaseCard>
  );
};
