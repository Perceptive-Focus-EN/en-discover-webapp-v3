import React from 'react';
import { Box } from '@mui/material';

const LineGraph: React.FC = () => (
  <Box sx={{ width: 200, height: 200 }}>
    <svg width="200" height="200" viewBox="0 0 200 200">
      <line x1="0" y1="0" x2="0" y2="200" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="50" y1="0" x2="50" y2="200" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="100" y1="0" x2="100" y2="200" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="150" y1="0" x2="150" y2="200" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="0" y1="50" x2="200" y2="50" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="0" y1="100" x2="200" y2="100" stroke="#E3E3ED" strokeWidth="1"/>
      <line x1="0" y1="150" x2="200" y2="150" stroke="#E3E3ED" strokeWidth="1"/>
      <polyline points="0,100 50,80 100,120 150,60 200,140" fill="none" stroke="#825EEB" strokeWidth="2"/>
      <circle cx="0" cy="100" r="4" fill="#FFA480"/>
      <circle cx="50" cy="80" r="4" fill="#FF6577"/>
      <circle cx="100" cy="120" r="4" fill="#C0EB86"/>
      <circle cx="150" cy="60" r="4" fill="#FFDF7B"/>
      <circle cx="200" cy="140" r="4" fill="#8B5CF6"/>
    </svg>
  </Box>
);

export default LineGraph;