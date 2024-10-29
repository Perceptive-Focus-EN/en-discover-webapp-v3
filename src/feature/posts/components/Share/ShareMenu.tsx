// src/features/posts/components/Share/ShareMenu.tsx
import React, { useState, useCallback } from 'react';
import { 
  Button, 
  Paper, 
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import { 
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Link as LinkIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareIcon } from 'lucide-react';
import { usePostEngagement } from '../../hooks/usePostEngagement';
import { Post, TextContent, PhotoContent, VideoContent, MoodContent, SurveyContent } from '../../api/types';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface ShareOption {
  platform: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  url?: string;
  action?: () => Promise<void>;
}

// Helper function to get share content based on post type
const getShareContent = (post: Post): { title: string; content: string } => {
  switch (post.type) {
    case 'TEXT':
      return {
        title: (post.content as TextContent).text.slice(0, 100),
        content: (post.content as TextContent).text
      };
    case 'PHOTO':
      return {
        title: (post.content as PhotoContent).caption || 'Photo post',
        content: (post.content as PhotoContent).caption || 'Check out this photo'
      };
    case 'VIDEO':
      return {
        title: (post.content as VideoContent).caption || 'Video post',
        content: (post.content as VideoContent).caption || 'Check out this video'
      };
    case 'MOOD':
      return {
        title: `Mood: ${(post.content as MoodContent).mood}`,
        content: (post.content as MoodContent).caption || (post.content as MoodContent).mood
      };
    case 'SURVEY':
      return {
        title: (post.content as SurveyContent).question,
        content: (post.content as SurveyContent).question
      };
    default:
      return {
        title: 'Check out this post',
        content: 'Interesting post'
      };
  }
};

// Helper function to generate full URL
const getFullUrl = (postId: string) => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || '';
  return `${baseUrl}/posts/${postId}`;
};

// Updated ShareMenuProps to accept Post type
export interface ShareMenuProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  post,
  open,
  onClose,
}) => {
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const { title, content } = getShareContent(post);
  const fullUrl = getFullUrl(post.id);

  // Use the engagement hook
  const {
    isProcessing,
    metrics,
    handleShare: handlePostShare
  } = usePostEngagement({
    post,
    onShare: async (platform, postId) => {
      try {
        messageHandler.success(`Shared on ${platform}`);
      } catch (error) {
        messageHandler.error(`Failed to share on ${platform}`);
        throw error;
      }
    }
  });

  const shareOptions: ShareOption[] = [
    {
      platform: 'twitter',
      label: 'Twitter',
      icon: <TwitterIcon />,
      color: '#1DA1F2',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}&url=${encodeURIComponent(fullUrl)}`
    },
    {
      platform: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon />,
      color: '#4267B2',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
    },
    {
      platform: 'linkedin',
      label: 'LinkedIn',
      icon: <LinkedInIcon />,
      color: '#0A66C2',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`
    },
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      color: '#25D366',
      url: `https://wa.me/?text=${encodeURIComponent(`${content} ${fullUrl}`)}`
    },
    {
      platform: 'email',
      label: 'Email',
      icon: <EmailIcon />,
      color: '#EA4335',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${content}\n\n${fullUrl}`)}`
    },
    {
      platform: 'copy',
      label: 'Copy Link',
      icon: <LinkIcon />,
      color: '#666666',
      action: async () => {
        try {
          await navigator.clipboard.writeText(fullUrl);
          setShowCopyNotification(true);
          await handlePostShare('copy');
        } catch (error) {
          messageHandler.error('Failed to copy link');
          console.error('Failed to copy URL:', error);
        }
      }
    }
  ];

  const handleShare = async (option: ShareOption) => {
    if (isProcessing) return;

    try {
      if (option.action) {
        await option.action();
      } else if (option.url) {
        window.open(option.url, '_blank', 'noopener,noreferrer');
      }
      await handlePostShare(option.platform);
    } catch (error) {
      messageHandler.error(`Failed to share on ${option.platform}`);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperComponent={({ children }) => (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
              >
                <Paper>{children}</Paper>
              </motion.div>
            )}
          >
            <DialogTitle className="flex justify-between items-center">
              Share Post
              <div className="flex items-center">
                <Typography variant="caption" color="textSecondary" sx={{ mr: 2 }}>
                  {metrics.shareCount} shares
                </Typography>
                <IconButton onClick={onClose} size="small">
                  <CloseIcon />
                </IconButton>
              </div>
            </DialogTitle>
            <DialogContent>
              <div className="grid grid-cols-2 gap-3 p-2">
                {shareOptions.map((option) => (
                  <Tooltip key={option.platform} title={option.label}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={option.icon}
                      onClick={() => handleShare(option)}
                      disabled={isProcessing}
                      sx={{
                        backgroundColor: option.color,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: option.color,
                          opacity: 0.9
                        },
                        textTransform: 'none'
                      }}
                    >
                      {option.label}
                    </Button>
                  </Tooltip>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <Snackbar
        open={showCopyNotification}
        autoHideDuration={3000}
        onClose={() => setShowCopyNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowCopyNotification(false)} 
          severity="success"
          variant="filled"
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

// Updated ShareButtonProps to accept Post type
export interface ShareButtonProps {
  post: Post;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ post }) => {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { metrics, isProcessing } = usePostEngagement({
    post
  });

  if (error) {
    return (
      <Tooltip title="Share unavailable">
        <IconButton disabled>
          <ShareIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title={isProcessing ? "Processing..." : "Share"}>
        <IconButton 
          onClick={() => setIsShareMenuOpen(true)}
          disabled={isProcessing}
          className="relative"
        >
          {isProcessing ? (
            <CircularProgress size={20} />
          ) : (
            <ShareIcon />
          )}
          {metrics.shareCount > 0 && (
            <Typography
              variant="caption"
              component="span"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.75rem'
              }}
            >
              {metrics.shareCount}
            </Typography>
          )}
        </IconButton>
      </Tooltip>

      <ShareMenu
        post={post}
        open={isShareMenuOpen}
        onClose={() => setIsShareMenuOpen(false)}
      />
    </>
  );
};
