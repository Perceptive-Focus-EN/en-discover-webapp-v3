import React, { useState, useCallback, Suspense } from 'react';
import { NextPage } from 'next';
import { Filter, TrendingUp, UserPlus } from 'lucide-react';
import { PostProvider } from '../feature/context/PostContext'; // Updated import
import { usePost } from '../feature/posts/hooks/usePost'; // Updated import
import { useAuth } from '@/contexts/AuthContext';
import { useMoodBoard } from '@/contexts/MoodBoardContext';
import { Feed } from '@/feature/posts/components/Feed';
import { PostEditor } from '@/feature/posts/components/PostEditor/PostEditor';
import UserMoodBubble from '@/feature/UserMoodBubble';
import EmotionBubble from '@/feature/EmotionBubble';
import SuggestedConnections from '@/feature/SuggestedConnections';
import { Grid, Paper, Typography, IconButton, Box, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import EmotionFilterDrawer from '@/feature/EmotionFilterDrawer';
import { Post } from '@/feature/posts/api/types';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

const FeedPageContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { emotions } = useMoodBoard();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeEmotions, setActiveEmotions] = useState<number[]>([]);

  const { refresh } = usePost(); // Access refresh function from usePost context

  if (!user) {
    return (
      <Typography variant="h5" align="center" mt={10}>
        Please log in to view the feed.
      </Typography>
    );
  }

  const handleEmotionToggle = useCallback((emotionId: number) => {
    setActiveEmotions((prev) =>
      prev.includes(emotionId)
        ? prev.filter((id) => id !== emotionId)
        : [...prev, emotionId]
    );
  }, []);

  // Updated handlePostCreated with refresh logic
  const handlePostCreated = useCallback(async (newPost: Post) => {
    try {
      await refresh(); // Refresh the feed
      messageHandler.success('Post created successfully');
    } catch (error) {
      messageHandler.error('Failed to refresh feed');
      console.error('Feed refresh error:', error);
    }
  }, [refresh]);

  return (
    <Grid container spacing={3} sx={{ py: 3 }}>
      {/* Mobile-specific content */}
      {isMobile && (
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <UserMoodBubble user={user} />
          </Paper>
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filter by Emotion
            </Typography>
            <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2}>
              {emotions.map((emotion) => (
                <EmotionBubble
                  key={emotion.id}
                  emotion={emotion}
                  isActive={activeEmotions.includes(emotion.id)}
                  onToggle={() => handleEmotionToggle(emotion.id)}
                />
              ))}
            </Box>
          </Paper>
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <TrendingUp className="mr-2" /> Trending Topics
            </Typography>
            <Box>
              {/* Trending topics list */}
              <Typography variant="body1" sx={{ py: 1, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                #TrendingTopic1
              </Typography>
              <Typography variant="body1" sx={{ py: 1, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                #TrendingTopic2
              </Typography>
              <Typography variant="body1" sx={{ py: 1 }}>
                #TrendingTopic3
              </Typography>
            </Box>
          </Paper>
        </Grid>
      )}

      {/* Left Column */}
      <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <UserMoodBubble user={user} />
        </Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter by Emotion
          </Typography>
          <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2}>
            {emotions.map((emotion) => (
              <EmotionBubble
                key={emotion.id}
                emotion={emotion}
                isActive={activeEmotions.includes(emotion.id)}
                onToggle={() => handleEmotionToggle(emotion.id)}
              />
            ))}
          </Box>
        </Paper>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <TrendingUp className="mr-2" /> Trending Topics
          </Typography>
          <Box>
            <Typography
              variant="body1"
              sx={{
                py: 1,
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              #TrendingTopic1
            </Typography>
            <Typography
              variant="body1"
              sx={{
                py: 1,
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              #TrendingTopic2
            </Typography>
            <Typography
              variant="body1"
              sx={{
                py: 1,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              #TrendingTopic3
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Main Content */}
      <Grid item xs={12} md={6}>
        <PostEditor 
          onPostCreated={handlePostCreated} 
          onSuccess={() => messageHandler.success('Post action successful')}
          onCancel={() => messageHandler.info('Post action cancelled')}
        />
        <Suspense fallback={<CircularProgress />}>
          <Feed />
        </Suspense>
      </Grid>

      {/* Right Column */}
      <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <UserPlus className="mr-2" /> Suggested Connections
          </Typography>
          <SuggestedConnections />
        </Paper>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Activity Feed
          </Typography>
          <Box>
            <Typography variant="body2" sx={{ py: 1, color: 'text.secondary' }}>
              Recent interactions from your network
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ py: 1, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                User1 liked User2's post
              </Typography>
              <Typography variant="body2" sx={{ py: 1, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                User3 commented on your post
              </Typography>
              <Typography variant="body2" sx={{ py: 1 }}>
                User4 shared your post
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Mobile Filter Button */}
      {isMobile && (
        <>
          <IconButton
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 50,
              bgcolor: 'background.paper'
            }}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            <Filter size={24} />
          </IconButton>
          <EmotionFilterDrawer
            open={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            emotions={emotions}
            activeEmotions={activeEmotions}
            onEmotionToggle={handleEmotionToggle}
          />
        </>
      )}
    </Grid>
  );
};

// Wrap the page with PostProvider
const FeedPage: NextPage = () => (
  <PostProvider>
    <FeedPageContent />
  </PostProvider>
);

export default FeedPage;
