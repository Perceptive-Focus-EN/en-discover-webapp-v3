import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface PlaceholderProps {
  message: string;
  onExploreCharts: () => void;
}

const Placeholder: React.FC<PlaceholderProps> = ({ message, onExploreCharts }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        flexDirection: 'column',
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        p: 3,
      }}
    >
      <Typography variant="h5" gutterBottom>
        {message}
      </Typography>
      <Box sx={{ width: '100%', maxWidth: '600px', my: 3 }}>
        <video
          width="100%"
          controls
          src="https://mirasmindstorage.blob.core.windows.net/videos/HuddleAI_Demo.mp4?sp=r&st=2024-08-01T22:23:24Z&se=2026-08-02T06:23:24Z&sv=2022-11-02&sr=b&sig=yHbiLo63k65nVMSPW%2F5aM9CRW24UdgVtjrsDOpyzPhs%3D"
        />
      </Box>
      <Button variant="contained" color="primary" onClick={onExploreCharts}>
        Explore Chart Library
      </Button>
    </Box>
  );
};

export default Placeholder;
