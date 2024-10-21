import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  SwipeableDrawer,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';
import BubbleChart from './charts/BubbleChart';
import RadarChart from './charts/RadarChart';
import LineGraph from './charts/LineGraph';
import Draggables from './charts/Draggables';
import BubbleBarChart from './charts/BubbleBarChart';

// Define display type options, combining both approaches
const displayTypeOptions = [
  {
    name: 'Bubbles',
    description: 'Interact with Bubbles to reach the best experience',
    component: <BubbleChart />,
  },
  {
    name: 'Balance',
    description: 'Track your mood balance in an easy and clear way',
    component: <RadarChart />,
  },
  {
    name: 'Graph',
    description: 'Continuously monitor mood changes visually',
    component: <LineGraph />,
  },
  {
    name: 'Draggables',
    description: 'Play with your moods like bumper cars',
    component: <Draggables />,
  },
  {
    name: 'BubbleBar',
    description: 'View your moods as bubble-like bar charts',
    component: <BubbleBarChart isThumbnail={true} />,
  },
];

interface ChartOptionsProps {
  open: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  currentSelection: string;
}

const ChartOptions: React.FC<ChartOptionsProps> = ({ open, onClose, onSelect, currentSelection }) => {
  const theme = useTheme();

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: 'background.default',
        },
      }}
    >
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">Choose Display Type</Typography>
          <IconButton onClick={onClose} aria-label="close" sx={{ p: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {displayTypeOptions.map((option) => (
          <Card
            key={option.name}
            onClick={() => onSelect(option.name)}
            sx={{
              mb: 2,
              cursor: 'pointer',
              border: currentSelection === option.name ? `2px solid ${theme.palette.primary.main}` : 'none',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box
                sx={{
                  mr: 3,
                  width: 120,
                  height: 120,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ transform: 'scale(0.75)' }}>{option.component}</Box>
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>{option.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </Box>
              {currentSelection === option.name && (
                <CheckIcon color="primary" sx={{ ml: 2 }} />
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </SwipeableDrawer>
  );
};

export default ChartOptions;