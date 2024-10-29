import React from 'react';
import { SwipeableDrawer, Container, Box, Typography, IconButton, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { EmotionId, EmotionType } from './types/Reaction';
import { Emotion } from '../components/EN/types/emotions';
import { parseToRgba, darken, lighten, rgba } from 'color2k';

interface EmotionSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onEmotionSelect: (emotionId: EmotionId) => void;
  emotions: Emotion[];
  isLoading: boolean;
  error: string | null;
}

const EmotionSelectionDrawer: React.FC<EmotionSelectionDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
  onEmotionSelect,
  emotions,
  isLoading,
  error,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getEmotionGradient = (color: string) => {
    const [r, g, b, a] = parseToRgba(color);
    const lightColor = lighten(rgba(r, g, b, a), 0.1);
    const darkColor = darken(rgba(r, g, b, a), 0.1);
    return `linear-gradient(135deg, ${lightColor}, ${darkColor})`;
  };

  const getShadowColor = (color: string) => {
    const [r, g, b] = parseToRgba(color);
    return rgba(r, g, b, 0.3);
  };

  const handleEmotionClick = (emotionId: EmotionId) => {
    onEmotionSelect(emotionId);
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '80vh',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontSize: { xs: '18px', sm: '20px' } }}>Choose an Emotion</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>{error}</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '70px' : '80px'}, 1fr))`,
              gap: { xs: 1, sm: 2 },
              justifyContent: 'center',
            }}
          >
            {EmotionType.map((emotionType) => {
              const userEmotion = emotions.find(e => e.id === emotionType.id);
              const emotionColor = userEmotion?.color || 'rgba(204, 204, 204, 1)';
              return (
                <Box 
                  key={emotionType.id}
                  sx={{ 
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 },
                  }}
                  onClick={() => handleEmotionClick(emotionType.id)}
                >
                  <Box
                    sx={{
                      width: { xs: '50px', sm: '60px' },
                      height: { xs: '50px', sm: '60px' },
                      borderRadius: '50%',
                      background: getEmotionGradient(emotionColor),
                      margin: '0 auto',
                      boxShadow: `0 4px 8px ${getShadowColor(emotionColor)}`,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    align="center" 
                    sx={{ 
                      fontSize: { xs: '10px', sm: '12px' },
                      mt: 1,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {emotionType.emotionName}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
    </SwipeableDrawer>
  );
};

export default EmotionSelectionDrawer;
// 
// 
// To understand a human's emotions through this structure, we'd primarily focus on the MoodEntries collection, with support from the EmotionMappings collection. Here's how we could query and analyze the data to gain insights into a user's emotional state:
// 
// Recent Mood Entries:
// 
// sqlCopySELECT * FROM c
// WHERE c.userId = 'user123'
// AND c.type = 'moodEntry'
// ORDER BY c.date DESC
// OFFSET 0 LIMIT 10
// This query fetches the 10 most recent mood entries for a specific user, giving us a snapshot of their recent emotional states.
// 
// Emotion Frequency over Time:
// 
// sqlCopySELECT c.emotionName, COUNT(1) as frequency
// FROM c
// WHERE c.userId = 'user123'
// AND c.type = 'moodEntry'
// AND c.date >= '2023-05-01' AND c.date < '2023-06-01'
// GROUP BY c.emotionName
// This query shows how often each emotion was recorded in a given time period (e.g., last month).
// 
// Average Emotion Intensity:
// 
// sqlCopySELECT c.emotionName, AVG(c.volume) as avgIntensity
// FROM c
// WHERE c.userId = 'user123'
// AND c.type = 'moodEntry'
// GROUP BY c.emotionName
// This query calculates the average intensity (volume) for each emotion.
// 
// Emotion Triggers (Sources):
// 
// sqlCopySELECT c.emotionName, c.sources, COUNT(1) as frequency
// FROM c
// WHERE c.userId = 'user123'
// AND c.type = 'moodEntry'
// GROUP BY c.emotionName, c.sources
// This query helps identify what sources (triggers) are most commonly associated with each emotion.
// 
// Emotion Trends over Time:
// 
// sqlCopySELECT SUBSTRING(c.userId_date, 15, 8) as date, c.emotionName, COUNT(1) as count
// FROM c
// WHERE c.userId = 'user123'
// AND c.type = 'moodEntry'
// GROUP BY SUBSTRING(c.userId_date, 15, 8), c.emotionName
// ORDER BY date
// This query shows how the frequency of each emotion changes over time.
// 
// Most Common Emotion-Color Associations:
// 
// sqlCopySELECT e.emotionName, e.color, COUNT(1) as entryCount
// FROM EmotionMappings e
// JOIN MoodEntries m
// ON e.userId = m.userId AND e.emotionName = m.emotionName
// WHERE e.userId = 'user123'
// GROUP BY e.emotionName, e.color
// ORDER BY entryCount DESC
// This query combines data from EmotionMappings and MoodEntries to show which colors are most commonly associated with each emotion for this user.
// 
// Emotion Patterns by Time of Day:
// 
// sqlCopySELECT DATEPART(HOUR, c.date) as hourOfDay, c.emotionName, COUNT(1) as frequency
// FROM c
// WHERE c.userId = 'user123'
// AND c.type = 'moodEntry'
// GROUP BY DATEPART(HOUR, c.date), c.emotionName
// ORDER BY hourOfDay, frequency DESC
// This query helps identify patterns in emotions based on the time of day.
// To implement these in your application:
// 
// Create an analysis service that runs these queries periodically or on-demand.
// Store the results in a cache or a separate analytics collection for quick access.
// Implement a dashboard in your frontend that visualizes these results using charts and graphs.
// Provide insights to the user based on this data, such as:
// 
// "Your most frequent emotion this month was [emotion]"
// "You tend to feel [emotion] most often in the [morning/afternoon/evening]"
// "Your [emotion] is most often triggered by [source]"
// "[Emotion] has been increasing/decreasing over the past week"
// 
// 
// 
// Remember to respect user privacy and provide clear opt-in/opt-out options for this kind of analysis. Also, consider implementing machine learning models that can predict future emotional states or provide more nuanced insights based on this data.