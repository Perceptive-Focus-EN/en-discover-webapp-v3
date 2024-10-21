import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Container, IconButton, createTheme, ThemeProvider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersistentBottomSheet from '../components/EN/RelationshipFlow/PersistentBottomSheet';
import VolumeToggle from '../components/EN/RelationshipFlow/VolumeToggle';
import RelationshipTags from '../components/EN/RelationshipFlow/RelationshipTags';
import CheckBoxComponent from '../components/EN/RelationshipFlow/CheckBoxComponent';
import { Emotion } from '../components/EN/types/emotions';
import { convertTailwindToHex } from '../utils/colorUtils';

const RelationshipMoodPage: React.FC = () => {
  const router = useRouter();
  const { selectedEmotion } = router.query;

  useEffect(() => {
    if (!selectedEmotion) {
      // Handle the case when no emotion is selected
      router.push('/mood-board');
    }
  }, [selectedEmotion, router]);

  if (!selectedEmotion) {
    return null;
  }

  const emotion = JSON.parse(selectedEmotion as string) as Emotion;
  const lightColor = convertTailwindToHex((emotion.color as any)?.light || '');
  const darkColor = convertTailwindToHex((emotion.color as any)?.dark || '');

  const theme = createTheme({
    palette: {
      background: {
        default: lightColor as string | undefined,
      },
      primary: {
        main: Array.isArray(darkColor) ? darkColor[0] : darkColor || '#000000', // default to black if darkColor is undefined
      },
    },
  });

  const handleClose = () => {
    router.push('/mood-board');
  };

  const handleBack = () => {
    router.push('/mood-board');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          padding: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Header Section */}
        <Container sx={{ position: 'relative', mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img
                src="https://via.placeholder.com/7x11"
                alt="Back Arrow Icon"
                style={{ width: 20, height: 20 }}
                onClick={handleBack}
              />
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                {emotion.emotionName}
              </Typography>
            </Box>
            <IconButton onClick={handleClose}>
              <CloseIcon sx={{ color: '#ffffff' }} />
            </IconButton>
          </Box>
          <Typography
            variant="h5"
            sx={{ color: '#ffffff', fontWeight: 'bold', textAlign: 'center', mb: 1 }}
          >
            What is your emotional volume?
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#FFEBEE', textAlign: 'center' }}
          >
            Select volume and cause of feelings and one or several causes within category
          </Typography>
        </Container>
        {/* Persistent Bottom Sheet */}
        <PersistentBottomSheet buttonColor={theme.palette.primary.main}>
          <VolumeToggle buttonColor={theme.palette.primary.main} />
          <Box sx={{ my: 2, height: 1, backgroundColor: 'divider' }} />
          <RelationshipTags />
          <Box sx={{ my: 2, height: 1, backgroundColor: 'divider' }} />
          <CheckBoxComponent />
        </PersistentBottomSheet>
      </Box>
    </ThemeProvider>
  );
};

export default RelationshipMoodPage;