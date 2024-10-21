// src/components/Onboarding/Steps/GoalsAndObjectivesStep.tsx

import React, { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, SelectChangeEvent, Chip } from '@mui/material';
import { GoalsAndObjectivesStepData, OnboardingStepName } from '@/types/Onboarding/interfaces';
import { BUSINESS_GOALS } from '@/constants/constants';
import { Goals } from '@/types/Shared/enums';
import { useOnboarding } from '../../../contexts/OnboardingContext';

interface GoalsAndObjectivesStepProps {
  onSubmit: (stepName: OnboardingStepName, data: GoalsAndObjectivesStepData) => Promise<void>;
}

const GoalsAndObjectivesStep: React.FC<GoalsAndObjectivesStepProps> = ({ onSubmit }) => {
  const [goals, setGoals] = useState<Goals[]>([]);
  const { moveToNextStep } = useOnboarding();

  const handleGoalChange = (event: SelectChangeEvent<Goals[]>) => {
    const value = event.target.value;
    setGoals(typeof value === 'string' ? [value as Goals] : value as Goals[]);
  };

  const handleSubmit = async () => {
    try {
      await onSubmit('GoalsAndObjectives', { goals });
      moveToNextStep();
    } catch (error) {
      console.error('Error submitting goals and objectives:', error);
    }
  };

  return (
    <Box>
      <FormControl fullWidth margin="normal">
        <InputLabel id="goals-label">Goals and Objectives</InputLabel>
        <Select
          labelId="goals-label"
          multiple
          value={goals}
          onChange={handleGoalChange}
          renderValue={(selected) => (
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {(selected as Goals[]).map((goal) => (
                <Chip key={goal} label={goal} />
              ))}
            </Box>
          )}
        >
          {BUSINESS_GOALS.map((goal) => (
            <MenuItem key={goal} value={goal}>
              {goal}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default GoalsAndObjectivesStep;
