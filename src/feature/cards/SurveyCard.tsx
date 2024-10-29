// src/components/Feed/cards/SurveyCard.tsx

import React, { useState } from 'react';
import { BaseCard, BaseCardProps } from './BaseCard';
import { Box, Typography, Button, LinearProgress } from '@mui/material';

export interface SurveyCardProps extends BaseCardProps {
  question: string;
  options: {
    text: string;
    color?: string;
  }[];
  backgroundColor?: string;
  questionColor?: string;
  optionTextColor?: string;
  showResults?: boolean;
}

export const SurveyCard: React.FC<SurveyCardProps> = (props) => {
  const { 
    question, 
    options, 
    backgroundColor = '#f0f2f5', 
    questionColor = '#1a1a1a', 
    optionTextColor = '#333333',
    showResults = false,
    ...baseProps 
  } = props;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResultsState, setShowResultsState] = useState(showResults);

  const handleVote = (index: number) => {
    setSelectedOption(index);
    setShowResultsState(true);
    // Here you would typically send the vote to your backend
  };

  const totalVotes = 100; // This should come from your backend

  return (
    <BaseCard {...baseProps}>
      <Box sx={{ p: 3, backgroundColor, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: questionColor, fontWeight: 'bold' }}>
          {question}
        </Typography>
        <Box sx={{ mt: 2 }}>
          {options.map((option, index) => (
            <Button
              key={index}
              fullWidth
              variant={selectedOption === index ? "contained" : "outlined"}
              sx={{
                mt: 1,
                textAlign: 'left',
                justifyContent: 'flex-start',
                color: optionTextColor,
                backgroundColor: option.color || 'transparent',
                '&:hover': {
                  backgroundColor: option.color ? `${option.color}80` : 'rgba(0, 0, 0, 0.08)',
                },
              }}
              onClick={() => handleVote(index)}
              disabled={showResultsState && selectedOption !== null}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="body1">{option.text}</Typography>
                {showResultsState && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.random() * 100} // Replace with actual percentage
                      sx={{ height: 8, borderRadius: 5 }}
                    />
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                      {Math.round(Math.random() * 100)}% • {Math.round(Math.random() * totalVotes)} votes
                    </Typography>
                  </Box>
                )}
              </Box>
            </Button>
          ))}
        </Box>
        {!showResultsState && (
          <Button 
            sx={{ mt: 2 }} 
            variant="text" 
            onClick={() => setShowResultsState(true)}
          >
            View Results
          </Button>
        )}
      </Box>
    </BaseCard>
  );
};