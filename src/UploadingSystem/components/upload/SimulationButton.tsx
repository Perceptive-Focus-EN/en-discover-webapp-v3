import React, { useState } from "react";
import { UploadStatus, UPLOAD_STATUS } from "@/UploadingSystem/constants/uploadConstants";
import { Box, Button, CircularProgress, ButtonGroup, Stack } from "@mui/material";

interface SimulationButtonProps {
  onClick: () => void;
}

export const SimulationButton: React.FC<SimulationButtonProps> = ({ onClick }) => {
  const [status, setStatus] = useState<UploadStatus>(UPLOAD_STATUS.INITIALIZING);

  const handleClick = () => {
    setStatus(UPLOAD_STATUS.UPLOADING);
    onClick();
    setTimeout(() => {
      setStatus(UPLOAD_STATUS.PROCESSING);
      setTimeout(() => {
        setStatus(UPLOAD_STATUS.COMPLETED);
      }, 2000); // Simulate a 2-second processing delay
    }, 3000); // Simulate a 3-second upload delay
  };

  const handlePause = () => {
    setStatus(UPLOAD_STATUS.PAUSED);
    setTimeout(() => {
      setStatus(UPLOAD_STATUS.RESUMING);
      setTimeout(() => {
        setStatus(UPLOAD_STATUS.UPLOADING);
      }, 2000); // Simulate a 2-second resuming delay
    }, 2000); // Simulate a 2-second pause delay
  };

  const handleCancel = () => {
    setStatus(UPLOAD_STATUS.CANCELLED);
  };

  const handleFail = () => {
    setStatus(UPLOAD_STATUS.FAILED);
  };

  return (
    <Box className="mt-6 flex justify-center">
      <Stack direction="row" spacing={2}>
        <ButtonGroup variant="contained" aria-label="outlined primary button group">
          <Button
            onClick={handleClick}
            color="primary"
            disabled={status === UPLOAD_STATUS.UPLOADING || status === UPLOAD_STATUS.PROCESSING || status === UPLOAD_STATUS.PAUSED || status === UPLOAD_STATUS.RESUMING}
            startIcon={status === UPLOAD_STATUS.UPLOADING || status === UPLOAD_STATUS.PROCESSING ? <CircularProgress size={20} /> : null}
          >
            {status === UPLOAD_STATUS.UPLOADING ? 'Uploading...' : status === UPLOAD_STATUS.PROCESSING ? 'Processing...' : 'Simulate Upload'}
          </Button>
          <Button onClick={handlePause} color="secondary" disabled={status !== UPLOAD_STATUS.UPLOADING}>
            Pause
          </Button>
          <Button onClick={handleCancel} color="error" disabled={status === UPLOAD_STATUS.COMPLETED || status === UPLOAD_STATUS.CANCELLED || status === UPLOAD_STATUS.FAILED}>
            Cancel
          </Button>
          <Button onClick={handleFail} color="warning" disabled={status === UPLOAD_STATUS.COMPLETED || status === UPLOAD_STATUS.CANCELLED || status === UPLOAD_STATUS.FAILED}>
            Fail
          </Button>
        </ButtonGroup>
      </Stack>
    </Box>
  );
};