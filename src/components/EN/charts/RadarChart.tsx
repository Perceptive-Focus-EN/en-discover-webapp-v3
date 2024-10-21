import React from 'react';
import { Box } from '@mui/material';

const RadarChart: React.FC = () => (
  <Box sx={{ width: 200, height: 200 }}>
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="80" stroke="#E3E3ED" strokeWidth="1" fill="none"/>
      <circle cx="100" cy="100" r="60" stroke="#E3E3ED" strokeWidth="1" fill="none"/>
      <circle cx="100" cy="100" r="40" stroke="#E3E3ED" strokeWidth="1" fill="none"/>
      <line x1="20" y1="100" x2="180" y2="100" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="100" y1="20" x2="100" y2="180" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="37" y1="37" x2="163" y2="163" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="163" y1="37" x2="37" y2="163" stroke="#E3E3ED" strokeWidth="1"/>
      <path d="M100,30 L40,70 L60,150 L140,150 L160,70 Z" fill="#825EEB" fillOpacity="0.2" stroke="#D7CCF9" strokeWidth="1"/>
      <circle cx="100" cy="30" r="5" fill="url(#grad1)"/>
      <circle cx="40" cy="70" r="5" fill="url(#grad2)"/>
      <circle cx="60" cy="150" r="5" fill="url(#grad3)"/>
      <circle cx="140" cy="150" r="5" fill="url(#grad4)"/>
      <circle cx="160" cy="70" r="5" fill="url(#grad5)"/>
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6577"/>
          <stop offset="100%" stopColor="#FF3636"/>
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C0EB86"/>
          <stop offset="100%" stopColor="#86B15C"/>
        </linearGradient>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFDF7B"/>
          <stop offset="100%" stopColor="#FFA746"/>
        </linearGradient>
        <linearGradient id="grad4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFA480"/>
          <stop offset="100%" stopColor="#FF6C4A"/>
        </linearGradient>
        <linearGradient id="grad5" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white"/>
          <stop offset="100%" stopColor="#DDE0E9"/>
        </linearGradient>
      </defs>
    </svg>
  </Box>
);

export default RadarChart;