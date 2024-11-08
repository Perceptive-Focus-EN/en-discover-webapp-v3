import { UPLOAD_STATUS, UploadStatus } from "@/UploadingSystem/constants/uploadConstants";
import { STATUS_COLORS } from "@/UploadingSystem/constants/uploadVisualization";
import { formatBytes } from "@/UploadingSystem/utils/upload";
import { Box, Chip, LinearProgress, Typography } from "@mui/material";

// src/UploadingSystem/components/upload/UploadHeader.tsx
interface UploadHeaderProps {
  status: UploadStatus;
  uploadSpeed: number;
}

export const UploadHeader: React.FC<UploadHeaderProps> = ({ 
  status, 
  uploadSpeed 
}) => (
  <Box className="mb-6 flex items-center justify-between">
    <Typography variant="h5" className="font-bold text-gray-800">
      Enhanced Security Upload Flow
    </Typography>
    <Box className="flex gap-4 items-center">
      <Typography variant="body2" className="text-gray-600">
        {uploadSpeed > 0 && `${formatBytes(uploadSpeed)}/s`}
      </Typography>
      <Chip 
        label={status} 
        color={STATUS_COLORS[status] || 'default'}
      />
    </Box>
  </Box>
);

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

// src/UploadingSystem/components/upload/SimulationButton.tsx
interface SimulationButtonProps {
  status: UploadStatus;
  onClick: () => void;
}

export const SimulationButton: React.FC<SimulationButtonProps> = ({
  status,
  onClick
}) => (
  <Box className="mt-6 flex justify-center">
    <button
      onClick={onClick}
      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      {status === UPLOAD_STATUS.UPLOADING ? 'Reset' : 'Simulate Upload'}
    </button>
  </Box>
);