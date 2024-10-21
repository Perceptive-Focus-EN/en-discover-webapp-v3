import React, { useState, useCallback } from 'react';
import { NextPage } from 'next';
import { Filter, TrendingUp, UserPlus } from 'lucide-react';
import { FeedProvider, useFeed } from '../components/Feed/context/FeedContext';
import { useAuth } from '../contexts/AuthContext';
import { useMoodBoard } from '../contexts/MoodBoardContext';
import PostCreator from '../components/Feed/PostCreator';
import Feed from '../components/Feed/Feed';
import UserMoodBubble from '../components/Feed/UserMoodBubble';
import EmotionBubble from '../components/Feed/EmotionBubble';
import SuggestedConnections from '../components/Feed/SuggestedConnections';
import { PostData } from '../components/Feed/types/Post';
import { Grid, Paper, Typography, Button, IconButton, Box, useTheme, useMediaQuery } from '@mui/material';
import EmotionFilterDrawer from '@/components/Feed/EmotionFilterDrawer';

const FeedPageContent: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    const { emotions } = useMoodBoard();
    const { addPost } = useFeed() as { addPost: (newPost: PostData) => Promise<void> };
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [activeEmotions, setActiveEmotions] = useState<number[]>([]);
    const [key, setKey] = useState(0);
    const [feedType, setFeedType] = useState<'forYou' | 'following' | 'global'>('forYou');

    if (!user) {
        return (
            <Typography variant="h5" align="center" mt={10} className="animate-fade-in-down">
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

    const handlePostCreated = useCallback(
        async (newPost: PostData) => {
            await addPost(newPost);
            setKey((prevKey) => prevKey + 1);
        },
        [addPost]
    );

    return (
        <Grid container spacing={3} sx={{ py: 3 }} className="animate-fade-in-up">
            {/* Mobile-specific content at the top */}
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
                            <Typography variant="body1">Trending Topic 1</Typography>
                            <Typography variant="body1">Trending Topic 2</Typography>
                            <Typography variant="body1">Trending Topic 3</Typography>
                        </Box>
                    </Paper>
                    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                        <SuggestedConnections />
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
                        <Typography variant="body1">Trending Topic 1</Typography>
                        <Typography variant="body1">Trending Topic 2</Typography>
                        <Typography variant="body1">Trending Topic 3</Typography>
                    </Box>
                </Paper>
            </Grid>

            {/* Middle Column */}
            <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                    <PostCreator onPostCreated={handlePostCreated} />
                </Paper>

                <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                    <Box display="flex" justifyContent="center" gap={2}>
                        {(['forYou', 'following', 'global'] as const).map((type) => (
                            <Button
                                key={type}
                                variant={feedType === type ? 'contained' : 'text'}
                                color={feedType === type ? 'primary' : 'inherit'}
                                onClick={() => setFeedType(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Button>
                        ))}
                    </Box>
                </Paper>

                <Feed
                    key={`${key}-${feedType}`}
                    activeEmotions={activeEmotions}
                    feedType={feedType}
                />
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Paper elevation={3} sx={{ p: 2, mb: 3, height: '100%', overflow: 'hidden' }}>
                    <SuggestedConnections />
                </Paper>
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                        <UserPlus className="mr-2" /> Recommended Users
                    </Typography>
                    <SuggestedConnections />
                </Paper>
            </Grid>

            {/* Mobile-specific floating button and drawer */}
            {isMobile && (
                <>
                    <IconButton
                        color="primary"
                        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 50 }}
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="animate-bounce"
                    >
                        <Filter size={24} />
                    </IconButton>
                    <EmotionFilterDrawer
                        open={isFilterDrawerOpen}
                        onClose={() => setIsFilterDrawerOpen(false)}
                        emotions={emotions}
                        activeEmotions={activeEmotions}
                        onToggleEmotion={handleEmotionToggle}
                    />
                </>
            )}
        </Grid>
    );
};

const FeedPage: NextPage = () => (
    <FeedProvider>
        <FeedPageContent />
    </FeedProvider>
);

export default FeedPage;
