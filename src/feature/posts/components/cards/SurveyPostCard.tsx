// src/features/posts/components/cards/SurveyPostCard.tsx
import React, { useState } from 'react';
import { BaseCard } from './BaseCard';
import { SurveyContent, PostType } from '../../api/types';
import { BaseCardProps } from '../factory/types';
import { 
  Box, 
  Typography, 
  RadioGroup, 
  FormControlLabel, 
  Radio,
  Button,
  LinearProgress,
  Paper
} from '@mui/material';

interface SurveyPostCardProps extends BaseCardProps {
  type: Extract<PostType, 'SURVEY'>;
  content: SurveyContent;
}

export const SurveyPostCard: React.FC<SurveyPostCardProps> = ({
  content,
  ...baseProps
}) => {
  const [selectedOption, setSelectedOption] = useState<string>();
  const [hasVoted, setHasVoted] = useState(false);

  // Calculate total votes (in a real app, this would come from backend)
  const totalVotes = 10; // Placeholder

  const handleVote = () => {
    if (selectedOption) {
      setHasVoted(true);
      // Here you would typically make an API call to record the vote
    }
  };

  return (
    <BaseCard {...baseProps}>
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            mb: 2,
            fontWeight: content.fontWeight || 'bold',
            textAlign: content.alignment || 'left',
            fontSize: {
              small: '1rem',
              medium: '1.25rem',
              large: '1.5rem'
            }[content.fontSize || 'medium']
          }}
        >
          {content.question}
        </Typography>

        {!hasVoted ? (
          <>
            <RadioGroup
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              {content.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option.text}
                  control={<Radio />}
                  label={option.text}
                  sx={{
                    mb: 1,
                    '& .MuiFormControlLabel-label': {
                      color: option.color
                    }
                  }}
                />
              ))}
            </RadioGroup>
            <Button
              variant="contained"
              disabled={!selectedOption}
              onClick={handleVote}
              sx={{ mt: 2 }}
            >
              Vote
            </Button>
          </>
        ) : (
          <Box>
            {content.options.map((option, index) => {
              const voteCount = 2; // Placeholder
              const percentage = (voteCount / totalVotes) * 100;

              return (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{ mb: 2, p: 1 }}
                >
                  <Typography variant="body2">
                    {option.text}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ flex: 1, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: option.color
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption">
                      {percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        {content.caption && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            {content.caption}
          </Typography>
        )}
      </Box>
    </BaseCard>
  );
};