import { Box, LinearProgress, Typography } from "@mui/material";

// src/UploadingSystem/components/upload/ProgressIndicator.tsx
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
  <Box className="mb-4">
    <LinearProgress 
      variant="determinate" 
      value={progress} 
      className="h-2 rounded"
    />
    <Box className="flex justify-between mt-1">
      <Typography className="text-sm text-gray-600">
        {chunksCompleted} / {totalChunks} chunks
      </Typography>
      <Typography className="text-sm text-gray-600">
        {progress.toFixed(1)}%
      </Typography>
    </Box>
  </Box>
);
