// src/components/Auth/SignupForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, TextField, Button, MenuItem } from '@mui/material';
import { SignupRequest } from '../../types/Signup/interfaces';
import { ACCOUNT_TYPES, UserAccountType } from '../../constants/AccessKey/accounts';

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState<SignupRequest>({
    firstName: '',
    lastName: '',
    password: '',
    phone: '',
    email: '',
    tenantName: '',
    accountType: 'PERSONAL' as UserAccountType,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== confirmPassword) {
      return;
    }

    await signup(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
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
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="tenantName"
        label="Tenant Name"
        name="tenantName"
        value={formData.tenantName}
        onChange={handleChange}
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
        required
        fullWidth
        id="mobile"
        label="Mobile Number"
        name="mobile"
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
