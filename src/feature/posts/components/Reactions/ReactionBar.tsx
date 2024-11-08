import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, CircularProgress, useTheme } from '@mui/material';
import { EmotionId, EmotionName, PostReaction } from '@/feature/types/Reaction';
import { useReactions } from '../../hooks/useReactions';
import { useAuth } from '@/contexts/AuthContext';
import EmotionSelectionDrawer from '../../../EmotionSelectionDrawer';
import { emotionMappingsApi } from '@/lib/api/reactions/emotionMappings';
import { Emotion } from '@/components/EN/types/emotions';

export interface ReactionBarProps {
  postId: string;
  onReactionChange?: () => void;
  initialReactions: PostReaction[];
}

const ReactionBar: React.FC<ReactionBarProps> = ({ postId, onReactionChange }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { isLoading } = useReactions(postId);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchEmotions = async () => {
      if (!user) return;
      const fetchedEmotions = await emotionMappingsApi.getEmotionMappings(user.userId);
      setEmotions(fetchedEmotions);
    };

    fetchEmotions();
  }, [user]);

  const handleEmotionSelect = useCallback(
    async (emotionId: EmotionId) => {
      // Handle reaction logic here
      onReactionChange?.();
    },
    [onReactionChange]
  );

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Button onClick={() => setIsDrawerOpen(true)}>React</Button>
      <EmotionSelectionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEmotionSelect={handleEmotionSelect}
        emotions={emotions}
        isLoading={false}
        error={null}
      />
    </Box>
  );
};

export default ReactionBar;
