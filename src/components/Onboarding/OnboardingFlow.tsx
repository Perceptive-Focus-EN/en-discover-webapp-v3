import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingStepData, OnboardingStepName } from '../../types/Onboarding/interfaces';
import { ONBOARDING_STEPS } from '../../constants/onboarding';
import dynamic from 'next/dynamic';
import {
  Container,
  Paper,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import PersonalInfoStep from './Steps/PersonalInfoStep';
import CompanyInfoStep from './Steps/CompanyInfoStep';
import RoleSelectionStep from './Steps/RoleSelectionStep';
import GoalsAndObjectivesStep from './Steps/GoalsAndObjectivesStep';
import FinancialInfoStep from './Steps/FinancialInfoStep';
import VerificationStep from './Steps/VerificationStep';
import { useRouter } from 'next/router';
import { AccessLevel } from '@/constants/AccessKey/access_levels';

const Confetti = dynamic(() => import('canvas-confetti'), { ssr: false });

interface OnboardingFlowProps {}

const OnboardingFlow: React.FC<OnboardingFlowProps> = () => {
  const { user, refreshUser } = useAuth();
  const { currentStep, updateStep, isOnboardingComplete } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<OnboardingStepData | null>(null);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const [stepValidity, setStepValidity] = useState<Record<OnboardingStepName, boolean>>({
    Verification: false,
    PersonalInfo: false,
    CompanyInfo: false,
    RoleSelection: false,
    GoalsAndObjectives: false,
    FinancialInfo: false,
    Completed: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      if (!user) {
        router.push('/login');
      } else if (isOnboardingComplete) {
        router.push('/onboarding');
      }
    }
  }, [isClient, isOnboardingComplete, router, user]);

  useEffect(() => {
    if (isClient && user) {
      setStepValidity(prev => ({
        ...prev,
        Verification: user.isVerified || false,
      }));
    }
  }, [isClient, user]);

  if (!isClient) {
    return <CircularProgress />;
  }

  if (!user) {
    return <Typography>Please log in to continue.</Typography>;
  }

  const handleStepSubmit = async (stepName: OnboardingStepName, data: OnboardingStepData) => {
    if (!user) {
      setError('User not found. Please try logging in again.');
      return;
    }

    setLastSubmittedData(data);

    try {
      setIsRetrying(false);
      await updateStep(stepName, data);
      await refreshUser();
      setError(null);
      setStepValidity(prev => ({ ...prev, [stepName]: true }));
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      setError('Failed to save your information. Please try again.');
      setIsRetrying(true);
    }
  };

  const renderStep = (step: OnboardingStepName): React.ReactNode => {
    if (step === 'Verification' && user?.isVerified) {
      return renderStep(ONBOARDING_STEPS[1]);
    }

    switch (step) {
      case 'Verification':
        return <VerificationStep onSubmit={handleStepSubmit} />;
      case 'PersonalInfo':
        return <PersonalInfoStep onSubmit={handleStepSubmit} />;
      case 'CompanyInfo':
        return <CompanyInfoStep onSubmit={handleStepSubmit} />;
      case 'RoleSelection':
        return <RoleSelectionStep onSubmit={handleStepSubmit} />;
      case 'GoalsAndObjectives':
        return <GoalsAndObjectivesStep onSubmit={handleStepSubmit} />;
      case 'FinancialInfo':
        return <FinancialInfoStep onSubmit={handleStepSubmit} />;
      case 'Completed':
        return (
          <>
            <Typography variant="h5" align="center">Onboarding Complete!</Typography>
            {isClient && <Confetti />}
          </>
        );
      default:
        return null;
    }
  };

  const activeStep = ONBOARDING_STEPS.indexOf(currentStep);

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3}>
        <Box p={4}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Complete Your Profile
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {ONBOARDING_STEPS.map((step, index) => (
              <Step key={step} completed={stepValidity[step]}>
                <StepLabel error={index < activeStep && !stepValidity[step]}>{step}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box mt={4}>
            {activeStep === ONBOARDING_STEPS.length ? (
              <Typography variant="h5" align="center">
                Onboarding Complete!
              </Typography>
            ) : (
              renderStep(currentStep)
            )}
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {isRetrying && (
            <Alert 
              severity="warning" 
              sx={{ mt: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => lastSubmittedData && handleStepSubmit(currentStep, lastSubmittedData)}>
                  Retry
                </Button>
              }
            >
              Failed to save. Check your connection and try again.
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default OnboardingFlow;
