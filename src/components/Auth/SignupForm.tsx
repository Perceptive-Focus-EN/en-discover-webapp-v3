// src/components/Auth/SignupForm.tsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, TextField, Button, MenuItem, Alert } from '@mui/material';
import { SignupRequest } from '../../types/Signup/interfaces';
import { ACCOUNT_TYPES, UserAccountTypeEnum } from '../../constants/AccessKey/accounts';

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState<SignupRequest>({
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    phone: '', // This matches the interface
    tenantName: '',
    accountType: UserAccountTypeEnum.PERSONAL,
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();

  const validateForm = (): boolean => {
    // Clear previous error
    setError(null);

    // Required fields check
    const requiredFields: (keyof SignupRequest)[] = [
      'email',
      'password',
      'firstName',
      'lastName',
      'tenantName'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Password match check
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password strength check
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: SignupRequest) => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (!validateForm()) {
      return;
    }

    await signup(formData);
  } catch (err: any) {
    console.error('Signup submission error:', err);
    // Handle specific error codes
    if (err.response?.status === 409 || err.response?.data?.code === 'EMAIL_EXISTS') {
      setError('An account with this email already exists. Please use a different email or try logging in.');
    } else {
      setError(err.response?.data?.error || err.message || 'Failed to create account. Please try again.');
    }
  }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        error={!!error && error.includes('email')}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="firstName"
        label="First Name"
        name="firstName"
        autoComplete="given-name"
        value={formData.firstName}
        onChange={handleChange}
        error={!!error && error.includes('firstName')}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="lastName"
        label="Last Name"
        name="lastName"
        autoComplete="family-name"
        value={formData.lastName}
        onChange={handleChange}
        error={!!error && error.includes('lastName')}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="tenantName"
        label="Company/Organization Name"
        name="tenantName"
        value={formData.tenantName}
        onChange={handleChange}
        error={!!error && error.includes('tenantName')}
      />

      <TextField
        select
        margin="normal"
        required
        fullWidth
        id="accountType"
        label="Account Type"
        name="accountType"
        value={formData.accountType}
        onChange={handleChange}
      >
        {Object.entries(ACCOUNT_TYPES).map(([key, value]) => (
          <MenuItem key={key} value={value}>
            {key}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        margin="normal"
        fullWidth
        id="phone"
        label="Phone Number"
        name="phone"
        autoComplete="tel"
        value={formData.phone}
        onChange={handleChange}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange}
        error={!!error && error.includes('password')}
        helperText="Password must be at least 8 characters long"
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={!!error && error.includes('match')}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Sign Up
      </Button>
    </Box>
  );
};

export default SignupForm;