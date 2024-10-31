import { ReactionSummary } from "@/feature/types/Reaction";
import { Badge, Box } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { motion } from "framer-motion";

interface ReactionBubbleProps {
  reaction: ReactionSummary;
  index: number;
  total: number;
  config: {
    label: string;
    color: string;
    animate: {
      scale: number;
      rotate?: number;
    };
  };
  isAnimating: boolean;
  isUserReaction: boolean;
  onReact: () => void;
  tooltipContent: React.ReactNode;
  canReact: boolean;
}

const ReactionBubble: React.FC<ReactionBubbleProps> = ({
  reaction,
  index,
  total,
  config,
  isAnimating,
  isUserReaction,
  onReact,
  tooltipContent,
  canReact
}) => (
  <Tooltip title={tooltipContent} placement="top" arrow>
    <Badge
      badgeContent={reaction.count}
      color="primary"
      max={99}
      invisible={reaction.count === 0}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: isUserReaction ? config.color : undefined
        }
      }}
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={isAnimating ? config.animate : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Box
          onClick={canReact ? onReact : undefined}
          sx={{
            width: { xs: '20px', sm: '24px' },
            height: { xs: '20px', sm: '24px' },
            borderRadius: '50%',
            backgroundColor: config.color,
            marginLeft: index !== 0 ? '-8px' : '0',
            zIndex: total - index,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            cursor: canReact ? 'pointer' : 'default',
            border: isUserReaction ? '2px solid white' : 'none',
            '&:hover': canReact ? {
              transform: 'scale(1.1)',
              zIndex: total + 1,
            } : {},
            position: 'relative',
            boxShadow: isUserReaction ? 2 : 1,
          }}
        >
          <span>{reaction.count}</span>
        </Box>
      </motion.div>
    </Badge>
  </Tooltip>
);

export default ReactionBubble;