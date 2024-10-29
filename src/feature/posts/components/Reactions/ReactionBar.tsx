import React, { useState, useCallback } from 'react';
import { IconButton, Tooltip, Badge, CircularProgress, Button, useTheme, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionIdMap, EmotionName, Reaction, ReactionSummary } from '@/feature/types/Reaction';
import { useReactions } from '../../hooks/useReactions';
import { useAuth } from '@/contexts/AuthContext';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { Plus } from 'lucide-react';

interface ReactionBarProps {
  postId: string;
  onReactionChange?: () => void;
  initialReactions: Reaction[];
}

const EMOTION_CONFIG: Record<EmotionName, {
  label: string;
  color: string;
  animate: {
    scale: number;
    rotate?: number;
  };
}> = {
  EUPHORIC: { label: 'Euphoric', color: '#FFD700', animate: { scale: 1.3, rotate: 15 } },
  TRANQUIL: { label: 'Tranquil', color: '#87CEEB', animate: { scale: 1.2 } },
  REACTIVE: { label: 'Reactive', color: '#FF4500', animate: { scale: 1.2, rotate: -15 } },
  SORROW: { label: 'Sorrow', color: '#4682B4', animate: { scale: 1.1 } },
  FEAR: { label: 'Fear', color: '#800080', animate: { scale: 1.2 } },
  DISGUST: { label: 'Disgust', color: '#006400', animate: { scale: 1.1, rotate: -10 } },
  SUSPENSE: { label: 'Suspense', color: '#483D8B', animate: { scale: 1.2 } },
  ENERGY: { label: 'Energy', color: '#FF1493', animate: { scale: 1.3, rotate: 20 } }
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <CircularProgress size={24} />
  </div>
);

const ReactionBar: React.FC<ReactionBarProps> = ({
  postId,
  onReactionChange
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { summary, userReaction, toggleReaction, isLoading, metrics, canReact } = useReactions(postId);
  const [animatingEmotion, setAnimatingEmotion] = useState<EmotionName | null>(null);
  const [recentlyReacted, setRecentlyReacted] = useState<boolean>(false);
  const [showEmotionPicker, setShowEmotionPicker] = useState<boolean>(false);

  const isDarkMode = theme.palette.mode === 'dark';

  const backgroundStyle = {
    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '8px',
    my: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    }
  };

  const handleReactionClick = useCallback(async (emotionName: EmotionName) => {
    if (!user) {
      messageHandler.error('Please login to react');
      return;
    }
    
    if (recentlyReacted) return;

    setAnimatingEmotion(emotionName);
    setRecentlyReacted(true);

    try {
      await toggleReaction(EmotionIdMap[emotionName]);
      onReactionChange?.();
      setShowEmotionPicker(false);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setTimeout(() => {
        setAnimatingEmotion(null);
        setRecentlyReacted(false);
      }, 500);
    }
  }, [user, toggleReaction, onReactionChange, recentlyReacted]);

  const getTooltipContent = useCallback((reaction: ReactionSummary, config: typeof EMOTION_CONFIG[EmotionName]) => {
    const isOwnReaction = userReaction?.emotionId === EmotionIdMap[reaction.type];
    return (
      <div>
        <div>{`${config.label} (${reaction.count})`}</div>
        {reaction.recentUsers.length > 0 && (
          <div className="text-xs">
            {reaction.recentUsers.map(user => user.name).join(', ')}
          </div>
        )}
        {isOwnReaction && <div className="text-xs italic mt-1">You reacted with this</div>}
      </div>
    );
  }, [userReaction]);

  if (isLoading) return <LoadingSpinner />;

  // Empty state with emotion picker
  if (!summary || summary.length === 0 || showEmotionPicker) {
    return (
      <Paper elevation={0} sx={backgroundStyle}>
        <div className="flex flex-wrap gap-2 p-3">
          {!user ? (
            <div className="text-center p-2" style={{ color: theme.palette.text.secondary }}>
              Please login to react
            </div>
          ) : (
            Object.entries(EMOTION_CONFIG).map(([emotionName, config]) => (
              <Tooltip key={emotionName} title={config.label} placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleReactionClick(emotionName as EmotionName)}
                  disabled={recentlyReacted}
                  sx={{
                    p: 1,
                    border: `2px solid ${config.color}`,
                    bgcolor: `${config.color}22`,
                    '&:hover': {
                      bgcolor: `${config.color}33`,
                      transform: 'scale(1.1)'
                    },
                    '&:disabled': {
                      opacity: 0.5
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: config.color,
                      opacity: 0.9
                    }}
                  />
                </IconButton>
              </Tooltip>
            ))
          )}
        </div>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={backgroundStyle}>
      <div className="flex items-center gap-2 p-3">
        <AnimatePresence>
          {summary.map((reaction) => {
            const config = EMOTION_CONFIG[reaction.type];
            const isActive = userReaction?.emotionId === EmotionIdMap[reaction.type];

            return (
              <motion.div
                key={reaction.type}
                initial={{ scale: 1 }}
                animate={animatingEmotion === reaction.type ? config.animate : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip
                  title={getTooltipContent(reaction, config)}
                  placement="top"
                >
                  <span>
                    <Badge
                      badgeContent={reaction.count}
                      color="primary"
                      max={99}
                      invisible={reaction.count === 0}
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: isActive ? config.color : undefined
                        }
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleReactionClick(reaction.type)}
                        disabled={isLoading || recentlyReacted || !user}
                        sx={{
                          p: 1,
                          border: `2px solid ${config.color}`,
                          bgcolor: isActive ? `${config.color}22` : 'transparent',
                          '&:hover': {
                            bgcolor: `${config.color}33`,
                            transform: 'scale(1.1)'
                          },
                          '&:disabled': {
                            opacity: 0.5
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{
                            backgroundColor: config.color,
                            opacity: isActive ? 1 : 0.9
                          }}
                        />
                      </IconButton>
                    </Badge>
                  </span>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {user && (
          <Tooltip title="Add Reaction">
            <IconButton
              size="small"
              onClick={() => setShowEmotionPicker(true)}
              sx={{ 
                p: 1,
                border: `2px solid ${theme.palette.text.secondary}`,
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Plus size={24} />
            </IconButton>
          </Tooltip>
        )}

        {metrics && metrics.totalReactions > 0 && (
          <div style={{ color: theme.palette.text.secondary }} className="text-sm">
            {metrics.totalReactions} reactions
          </div>
        )}
      </div>
    </Paper>
  );
};

export { ReactionBar };