// src/feature/MoodBubbleLikeButton.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Tooltip, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/contexts/AuthContext';
import EmotionSelectionDrawer from './EmotionSelectionDrawer';
import { EmotionId, PostReaction, ReactionSummary } from './types/Reaction';
import { emotionMappingsApi } from '@/lib/api/reactions/emotionMappings';
import { api } from '@/lib/axiosSetup';

interface MoodBubbleLikeButtonProps {
  postId: string;
  reactionSummary?: ReactionSummary[];
  onReactionSelect: (emotionId: EmotionId) => void;
}

const MoodBubbleLikeButton: React.FC<MoodBubbleLikeButtonProps> = ({
  postId,
  reactionSummary = [],
  onReactionSelect,
}) => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [emotionMappings, setEmotionMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localReactionSummary, setLocalReactionSummary] = useState(reactionSummary);

  // Fetch emotion mappings
  const fetchEmotionMappings = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const fetchedEmotions = await emotionMappingsApi.getEmotionMappings(user.userId);
      setEmotionMappings(fetchedEmotions);
    } catch (error) {
      console.error('Failed to fetch emotion mappings:', error);
      setError('Failed to fetch emotion mappings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch reactions for the post
  const fetchReactions = useCallback(async () => {
    if (!postId) return;

    try {
      setIsLoading(true);
      const response = await api.get<{ reactions: PostReaction[] }>(`/api/posts/${postId}/reactions`);
      
      // Transform the response into ReactionSummary format
      const summary: ReactionSummary[] = response.reactions.map((reaction: PostReaction) => ({
        type: reaction.emotionName,
        count: Number(reaction.count) || 0,
        color: reaction.color,
        hasReacted: reaction.userId === user?.userId,
        recentUsers: reaction.user ? [{
          id: reaction.user.id,
          name: `${reaction.user.name.firstName} ${reaction.user.name.lastName}`,
          avatarUrl: reaction.user.avatarUrl
        }] : []
      }));

      setLocalReactionSummary(summary);
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
      setError('Failed to fetch reactions');
    } finally {
      setIsLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchEmotionMappings();
  }, [fetchEmotionMappings]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const handleEmotionSelect = async (emotionId: EmotionId) => {
    try {
      await onReactionSelect(emotionId);
      setIsDrawerOpen(false);
      // Fetch updated reactions after successful selection
      await fetchReactions();
    } catch (error) {
      setError('Failed to update reaction');
    }
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Button
        onClick={() => setIsDrawerOpen(true)}
        disabled={isLoading || !user}
        sx={{
          minWidth: '120px',
          height: '40px',
          padding: '6px 12px',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: 1,
        }}
      >
        {isLoading ? (
          <CircularProgress size={24} />
        ) : localReactionSummary.length === 0 ? (
          <>
            <AddIcon />
            <Typography sx={{ ml: 1 }}>
              {user ? 'React' : 'Login to react'}
            </Typography>
          </>
        ) : (
          localReactionSummary.map((reaction, index) => (
            <Tooltip 
              key={reaction.type} 
              title={
                <Box>
                  <Typography>{reaction.type}</Typography>
                  {reaction.recentUsers.length > 0 && (
                    <Typography variant="caption" display="block">
                      {reaction.recentUsers.map(u => u.name).join(', ')}
                    </Typography>
                  )}
                </Box>
              }
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: reaction.color,
                  marginLeft: index > 0 ? -1 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  border: reaction.hasReacted ? '2px solid white' : 'none',
                }}
              >
                {reaction.count}
              </Box>
            </Tooltip>
          ))
        )}
      </Button>

      <EmotionSelectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEmotionSelect={handleEmotionSelect}
        emotions={emotionMappings}
        isLoading={isLoading}
        error={error}
      />
    </Box>
  );
};

export default MoodBubbleLikeButton;