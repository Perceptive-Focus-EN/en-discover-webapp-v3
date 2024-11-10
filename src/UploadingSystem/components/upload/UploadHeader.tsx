import React from 'react';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import { UploadStatus } from '@/UploadingSystem/constants/uploadConstants';
import { formatBytes } from '@/utils/formatters';

interface UploadHeaderProps {
  status: UploadStatus;
  uploadSpeed: number;
  progress: number; // Add progress prop
  estimatedTimeRemaining: number; // Add estimated time remaining prop
}

export const UploadHeader: React.FC<UploadHeaderProps> = ({ status, uploadSpeed, progress, estimatedTimeRemaining }) => (
  <Box className="flex flex-col mb-4">
    <Box className="flex justify-between items-center mb-2">
      <Typography variant="h6">Upload Progress</Typography>
      <Box className="flex items-center space-x-2">
        <Chip
          label={status}
          color={status === 'completed' ? 'success' : 'primary'}
          variant="outlined"
        />
        {uploadSpeed > 0 && (
          <Chip
            label={`${formatBytes(uploadSpeed)}/s`}
            variant="outlined"
          />
        )}
      </Box>
    </Box>
    <LinearProgress variant="determinate" value={progress} />
    <Box className="flex justify-between items-center mt-2">
      <Typography variant="body2">{progress}%</Typography>
      {estimatedTimeRemaining > 0 && (
        <Typography variant="body2">
          {`Estimated time remaining: ${Math.ceil(estimatedTimeRemaining / 60)} min ${estimatedTimeRemaining % 60} sec`}
        </Typography>
      )}
    </Box>
  </Box>
);