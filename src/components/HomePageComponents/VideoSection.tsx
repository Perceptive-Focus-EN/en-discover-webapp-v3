import React, { useState } from 'react';
import { Typography, Box, Container, styled, Modal, Fade } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const VideoBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}));

const VideoTitle = styled(Typography)(({ theme }) => ({
  fontSize: '3rem',
  fontWeight: 700,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    fontSize: '2.5rem',
  },
}));

const VideoSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 400,
  marginBottom: theme.spacing(4),
  maxWidth: '600px',
  margin: '0 auto',
}));

const VideoPlaceholder = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '400px',
  marginTop: theme.spacing(4),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.grey[200],
  },
  backgroundColor: theme.palette.grey[300],
}));

const VideoModal = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const VideoSection: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <VideoBackground>
      <Fade in timeout={2500}>
      <Container maxWidth="lg">
        <Box mb={12} textAlign="center">
            <VideoTitle variant="h2" gutterBottom>
              See Your demo or advertisement video in Action
            </VideoTitle>
            <VideoSubtitle variant="body1" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
              Watch how YOUR COMPANY transforms WHAT YOUR COMPANY DOES HERE, helping WHAT YOUR COMPANY DOES TO HELP OTHERS.
            </VideoSubtitle>
            <VideoPlaceholder onClick={handleOpen}>
              <PlayArrowIcon fontSize="large" />
              <Typography variant="h6" sx={{ ml: 2 }}>Click to Play Demo Video</Typography>
            </VideoPlaceholder>
          </Box>
        </Container>
      </Fade>

      <VideoModal
        open={open}
        onClose={handleClose}
        aria-labelledby="demo-video"
        aria-describedby="HuddleAI demo video"
      >
        <Box sx={{ width: '80%', maxWidth: '1000px', bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <video width="100%" controls autoPlay>
          <source src="https://mirasmindstorage.blob.core.windows.net/videos/HuddleAI_Demo.mp4?sp=r&st=2024-08-01T22:23:24Z&se=2026-08-02T06:23:24Z&sv=2022-11-02&sr=b&sig=yHbiLo63k65nVMSPW%2F5aM9CRW24UdgVtjrsDOpyzPhs%3D" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>
      </VideoModal>
    </VideoBackground>
  );
};

export default VideoSection;

// https://mirasmindstorage.blob.core.windows.net/videos/Screen%20Recording%202024-07-29%20at%2012.33.49%E2%80%AFPM.mov?sp=r&st=2024-07-29T19:44:16Z&se=2030-07-30T03:44:16Z&sv=2022-11-02&sr=b&sig=3k1WWXjke9dBJy%2B45SGX74AGoa152dd%2BR1Cu%2F3%2F7KaA%3D