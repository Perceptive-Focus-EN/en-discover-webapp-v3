// src/features/posts/components/Reactions/ReactionBar.tsx
import React, { useState, useCallback } from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionId, EmotionName, EmotionIdMap, Reaction } from '@/feature/types/Reaction';
import { useReactions } from '../../hooks/useReactions';

interface ReactionBarProps {
  postId: string;
onReactionChange?: () => void;
initialReactions: Reaction[];

}

// Emotion configuration with proper mapping
const EMOTION_CONFIG: Record<EmotionName, {
  label: string;
  color: string;
  animate: {
    scale: number;
    rotate?: number;
  };
}> = {
  EUPHORIC: {
    label: 'Euphoric',
    color: '#FFD700', // Gold
    animate: { scale: 1.3, rotate: 15 }
  },
  TRANQUIL: {
    label: 'Tranquil',
    color: '#87CEEB', // Sky Blue
    animate: { scale: 1.2 }
  },
  REACTIVE: {
    label: 'Reactive',
    color: '#FF4500', // Orange Red
    animate: { scale: 1.2, rotate: -15 }
  },
  SORROW: {
    label: 'Sorrow',
    color: '#4682B4', // Steel Blue
    animate: { scale: 1.1 }
  },
  FEAR: {
    label: 'Fear',
    color: '#800080', // Purple
    animate: { scale: 1.2 }
  },
  DISGUST: {
    label: 'Disgust',
    color: '#006400', // Dark Green
    animate: { scale: 1.1, rotate: -10 }
  },
  SUSPENSE: {
    label: 'Suspense',
    color: '#483D8B', // Dark Slate Blue
    animate: { scale: 1.2 }
  },
  ENERGY: {
    label: 'Energy',
    color: '#FF1493', // Deep Pink
    animate: { scale: 1.3, rotate: 20 }
  }
};

export const ReactionBar: React.FC<ReactionBarProps> = ({
  postId,
  onReactionChange
}) => {
  const {
    summary,
    userReaction,
    toggleReaction,
    isLoading,
    metrics
  } = useReactions(postId);

  const [animatingEmotion, setAnimatingEmotion] = useState<EmotionName | null>(null);

  const handleReactionClick = useCallback(async (emotionName: EmotionName) => {
    setAnimatingEmotion(emotionName);
    try {
      await toggleReaction(EmotionIdMap[emotionName]);
      onReactionChange?.();
    } finally {
      setTimeout(() => setAnimatingEmotion(null), 500);
    }
  }, [toggleReaction, onReactionChange]);

  if (!summary) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 py-2">
      <AnimatePresence>
        {summary.map((reaction) => {
          const config = EMOTION_CONFIG[reaction.type];
          const isActive = userReaction?.emotionId === EmotionIdMap[reaction.type];
          const isAnimating = animatingEmotion === reaction.type;

          return (
            <motion.div
              key={reaction.type}
              initial={{ scale: 1 }}
              animate={isAnimating ? config.animate : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Tooltip
                title={
                  <div>
                    <div>{`${config.label} (${reaction.count})`}</div>
                    {reaction.recentUsers.length > 0 && (
                      <div className="text-xs">
                        {reaction.recentUsers
                          .map(user => user.name)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                }
                placement="top"
              >
                <Badge
                  badgeContent={reaction.count}
                  color="primary"
                  max={99}
                  invisible={reaction.count === 0}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleReactionClick(reaction.type)}
                    disabled={isLoading}
                    sx={{
                      color: isActive ? config.color : 'action.disabled',
                      '&:hover': {
                        color: config.color,
                        bgcolor: `${config.color}15`
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{
                        backgroundColor: config.color,
                        opacity: isActive ? 1 : 0.6,
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                  </IconButton>
                </Badge>
              </Tooltip>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {metrics && metrics.totalReactions > 0 && (
        <div className="text-sm text-gray-500 ml-2">
          {metrics.totalReactions} reactions
        </div>
      )}
    </div>
  );
};