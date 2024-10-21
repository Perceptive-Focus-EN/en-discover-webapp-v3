// src/components/Onboarding/Steps/VerificationStep.tsx

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '../../Common/MuiComponents';
import { VerificationStepData, OnboardingStepName } from '../../../types/Onboarding/interfaces';
import frontendEmailService from '../../../lib/api_s/emailing';
import { useAuth } from '../../../contexts/AuthContext';

// Ensure UPDATED_ONBOARDING_STEPS is typed correctly
const UPDATED_ONBOARDING_STEPS: OnboardingStepName[] = ['PersonalInfo', 'CompanyInfo', 'RoleSelection', 'GoalsAndObjectives', 'FinancialInfo','Verification'];


interface VerificationStepProps {
  onSubmit: (stepName: OnboardingStepName, data: VerificationStepData) => void;
}

const VerificationStep: React.FC<VerificationStepProps> = ({ onSubmit }) => {
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (user?.isVerified) {
      onSubmit('Verification', { verificationToken: 'verified' });
    }
  }, [user, onSubmit]);

  const handleSubmit = async () => {
    if (user?.isVerified) return;
  
    if (!verificationToken) {
      setError('Verification token is required.');
      return;
    }
  
    setIsLoading(true);
    setError('');
    try {
      const result = await frontendEmailService.verifyEmail(verificationToken);
  
      if (result.message === 'Email verified successfully. You can now proceed with your account.') {
        await refreshUser();
        onSubmit('Verification', { verificationToken: 'verified' });
  
        const nextStepIndex = UPDATED_ONBOARDING_STEPS.indexOf('Verification') + 1;
        if (nextStepIndex < UPDATED_ONBOARDING_STEPS.length) {
          const nextStep = UPDATED_ONBOARDING_STEPS[nextStepIndex];
          onSubmit(nextStep, { verificationToken: '' });
        }
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Error verifying email:', error);
      setError(error.response?.data?.message || 'Error verifying email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendToken = async () => {
    if (user?.isVerified) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await frontendEmailService.resendVerificationEmail();
      console.log('Resend verification response:', response);
      setResendDisabled(true);
      alert('Verification email resent. Please check your email for the new verification link.');
      setTimeout(() => setResendDisabled(false), 60000);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      setError(error.response?.data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6">Email Verification</Typography>
      <Typography>Please enter the verification token sent to {user?.email} or click the verification link in your email.</Typography>
      <TextField
        label="Verification Token"
        value={verificationToken}
        onChange={(e) => setVerificationToken(e.target.value)}
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Verify'}
      </Button>
      <Button 
        variant="text" 
        color="secondary" 
        onClick={handleResendToken} 
        disabled={resendDisabled || isLoading}
      >
        {resendDisabled ? 'Resend Email (Disabled)' : 'Resend Verification Email'}
      </Button>
    </Box>
  );
};

export default VerificationStep;
