import { UploadStatus, UPLOAD_STATUS } from "@/UploadingSystem/constants/uploadConstants";
import { Box } from "@mui/material";

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