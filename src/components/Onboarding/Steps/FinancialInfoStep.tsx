// src/components/Onboarding/Steps/FinancialInfoStep.tsx

import React, { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, SelectChangeEvent } from '@mui/material';
import { FinancialInfoStepData, OnboardingStepName } from '@/types/Onboarding/interfaces';
import { ANNUAL_REVENUES, EMPLOYEE_COUNT } from '@/constants/constants';
import { AnnualRevenue, EmployeeCount } from '@/types/Shared/enums';
import { useOnboarding } from '../../../contexts/OnboardingContext';

interface FinancialInfoStepProps {
  onSubmit: (stepName: OnboardingStepName, data: FinancialInfoStepData) => Promise<void>;
}

const FinancialInfoStep: React.FC<FinancialInfoStepProps> = ({ onSubmit }) => {
  const [annualRevenue, setAnnualRevenue] = useState<AnnualRevenue | null>(null);
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount | null>(null);
  const { moveToNextStep } = useOnboarding();

  const handleRevenueChange = (event: SelectChangeEvent<AnnualRevenue>) => {
    setAnnualRevenue(event.target.value as AnnualRevenue);
  };

  const handleEmployeeCountChange = (event: SelectChangeEvent<EmployeeCount>) => {
    setEmployeeCount(event.target.value as EmployeeCount);
  };

  const handleSubmit = async () => {
    try {
      await onSubmit('FinancialInfo', { annualRevenue, employeeCount });
      moveToNextStep();
    } catch (error) {
      console.error('Error submitting financial information:', error);
    }
  };

  return (
    <Box>
      <FormControl fullWidth margin="normal">
        <InputLabel id="revenue-label">Annual Revenue</InputLabel>
        <Select
          labelId="revenue-label"
          value={annualRevenue || ''}
          onChange={handleRevenueChange}
        >
          {ANNUAL_REVENUES.map((revenue) => (
            <MenuItem key={revenue} value={revenue}>
              {revenue}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <InputLabel id="employee-count-label">Employee Count</InputLabel>
        <Select
          labelId="employee-count-label"
          value={employeeCount || ''}
          onChange={handleEmployeeCountChange}
        >
          {EMPLOYEE_COUNT.map((count) => (
            <MenuItem key={count} value={count}>
              {count}
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

export default FinancialInfoStep;
