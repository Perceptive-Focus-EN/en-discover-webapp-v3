// src/components/Onboarding/Steps/PersonalInfoStep.tsx

import React, { useState } from 'react';
import { Box, TextField, Button } from '../../Common/MuiComponents';
import { PersonalInfoStepData, OnboardingStepName } from '../../../types/Onboarding/interfaces';
import { useOnboarding } from '../../../contexts/OnboardingContext';

interface PersonalInfoStepProps {
  onSubmit: (stepName: OnboardingStepName, data: PersonalInfoStepData) => Promise<void>;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const { moveToNextStep } = useOnboarding();

  const handleSubmit = async () => {
    try {
      await onSubmit('PersonalInfo', {
        firstName, lastName, dob, phone,
        email: ''
      });
      moveToNextStep();
    } catch (error) {
      console.error('Error submitting personal info:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <Box>
      <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth margin="normal" />
      <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth margin="normal" />
      <TextField label="Date of Birth" value={dob} onChange={(e) => setDob(e.target.value)} fullWidth margin="normal" type="date" InputLabelProps={{ shrink: true }} />
      <TextField label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth margin="normal" />
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default PersonalInfoStep;