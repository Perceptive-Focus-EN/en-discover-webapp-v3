// src/components/EditProfileForm.tsx

import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../utils/SnackbarManager';

interface EditProfileFormProps {
  onClose: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const { showMessage } = useSnackbar();
  const [formData, setFormData] = useState({
    name: user?.firstName || '',
    username: user?.firstName && user?.lastName  || '',
    email: user?.email || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement API call to update user profile
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Update AuthContext
      setUser({
        ...user!,
        ...formData,
      });
      showMessage('Profile updated successfully!', 'success');
      onClose();
    } catch (error) {
      showMessage('Failed to update profile. Please try again.', 'error');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" mb={2}>
        Edit Profile
      </Typography>
      <TextField
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        fullWidth
        margin="normal"
        variant="outlined"
      />
      <TextField
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleChange}
        fullWidth
        margin="normal"
        variant="outlined"
      />
      <TextField
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
        margin="normal"
        variant="outlined"
        type="email"
      />
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button onClick={onClose} color="secondary" sx={{ mr: 2 }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default EditProfileForm;
