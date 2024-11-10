import React from 'react';
import { Box, LinearProgress, Typography, Tooltip } from '@mui/material';

interface ProgressIndicatorProps {
  progress: number;
  chunksCompleted: number;
  totalChunks: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  chunksCompleted,
  totalChunks
}) => (
  <Box className="mb-6">
    <Box className="flex justify-between mb-1">
      <Typography variant="body2" color="textSecondary">
        {`${Math.round(progress)}%`}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {`${chunksCompleted}/${totalChunks} chunks`}
      </Typography>
    </Box>
    <Tooltip title={`Completed ${chunksCompleted} out of ${totalChunks} chunks`}>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        className="h-2 rounded"
      />
    </Tooltip>
  </Box>
);

ProgressIndicator.defaultProps = {
  progress: 0,
  chunksCompleted: 0,
  totalChunks: 0,
};