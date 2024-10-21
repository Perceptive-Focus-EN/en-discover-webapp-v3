// src/components/Onboarding/Steps/CompanyInfoStep.tsx

import React, { useState } from 'react';
import { Box, TextField, Button, MenuItem } from '../../Common/MuiComponents';
import { CompanyInfoStepData, OnboardingStepName } from '../../../types/Onboarding/interfaces';
import { Industry, EmployeeCount, AnnualRevenue } from '@/types/Shared/enums';
import {
  INDUSTRIES_LIST,
  EMPLOYEE_COUNT_LIST,
  ANNUAL_REVENUE_LIST,
} from '@/constants/constants';
import { useOnboarding } from '../../../contexts/OnboardingContext';

interface CompanyInfoStepProps {
  onSubmit: (stepName: OnboardingStepName, data: CompanyInfoStepData) => Promise<void>;
}

const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({ onSubmit }) => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState<Industry>(INDUSTRIES_LIST[0] as Industry);
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount>(EMPLOYEE_COUNT_LIST[0] as EmployeeCount);
  const [annualRevenue, setAnnualRevenue] = useState<AnnualRevenue>(ANNUAL_REVENUE_LIST[0] as AnnualRevenue);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { moveToNextStep } = useOnboarding();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!industry) newErrors.industry = 'Industry is required';
    if (!employeeCount) newErrors.employeeCount = 'Employee count is required';
    if (!annualRevenue) newErrors.annualRevenue = 'Annual revenue is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit('CompanyInfo', {
          companyName: companyName.trim(),
          industry: industry,
          employeeCount: employeeCount,
          annualRevenue: annualRevenue,
          companySize: employeeCount,
        });
        moveToNextStep();
      } catch (error) {
        console.error('Error submitting company info:', error);
        // Handle error (e.g., show error message to user)
      }
    }
  };

  return (
    <Box>
      <TextField 
        label="Company Name" 
        value={companyName} 
        onChange={(e) => setCompanyName(e.target.value)} 
        fullWidth 
        margin="normal"
        error={!!errors.companyName}
        helperText={errors.companyName}
        required
      />
      <TextField
        select
        label="Industry"
        value={industry}
        onChange={(e) => setIndustry(e.target.value as Industry)}
        fullWidth
        margin="normal"
        error={!!errors.industry}
        helperText={errors.industry}
        required
      >
        {INDUSTRIES_LIST.map((ind) => (
          <MenuItem key={ind} value={ind}>
            {ind}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Employee Count"
        value={employeeCount}
        onChange={(e) => setEmployeeCount(e.target.value as EmployeeCount)}
        fullWidth
        margin="normal"
        error={!!errors.employeeCount}
        helperText={errors.employeeCount}
        required
      >
        {EMPLOYEE_COUNT_LIST.map((count) => (
          <MenuItem key={count} value={count}>
            {count}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Annual Revenue"
        value={annualRevenue}
        onChange={(e) => setAnnualRevenue(e.target.value as AnnualRevenue)}
        fullWidth
        margin="normal"
        error={!!errors.annualRevenue}
        helperText={errors.annualRevenue}
        required
      >
        {ANNUAL_REVENUE_LIST.map((revenue) => (
          <MenuItem key={revenue} value={revenue}>
            {revenue}
          </MenuItem>
        ))}
      </TextField>
      <Box mt={2}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={!companyName.trim() || !industry || !employeeCount || !annualRevenue}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default CompanyInfoStep;