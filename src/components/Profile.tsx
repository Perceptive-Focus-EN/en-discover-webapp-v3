// src/components/Profile.tsx

import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Typography,
  Box,
  IconButton,
  Modal,
  Backdrop,
  Fade,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StyledPaper from './profile-addons/StyledPaper';
import ProfileSkeleton from './profile-addons/ProfileSkeleton';
import InfoList from './profile-addons/InfoList';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../utils/SnackbarManager';
import EditProfileForm from './EditProfileForm';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showMessage } = useSnackbar();
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);

  useEffect(() => {
    // Simulate fetching user data
    const fetchUserData = async () => {
      try {
        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (error) {
        showMessage('Failed to load profile information.', 'error');
      }
    };
    fetchUserData();
  }, [showMessage]);

  const handleEditOpen = () => {
    setOpenEditModal(true);
  };

  const handleEditClose = () => {
    setOpenEditModal(false);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const infoItems = [
    {
      label: 'Email',
      value: user?.email || 'Not provided',
      icon: null,
    },
    {
      label: 'Username',
      value: user?.firstName && user?.lastName || 'Not provided',
      icon: null,
    },
    // Add more info items as needed
  ];

  return (
    <StyledPaper>
      <Box display="flex" alignItems="center" mb={2}>
        <Avatar
          src={user?.avatarUrl}
          alt={user?.firstName}
          sx={{ width: 80, height: 80, mr: 2 }}
        />
        <Box flexGrow={1}>
          <Typography variant="h5" component="h1">
            {user?.firstName || 'User Name'}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {user?.email || 'User Email'}
          </Typography>
        </Box>
        <IconButton onClick={handleEditOpen}>
          <EditIcon />
        </IconButton>
      </Box>
      <InfoList infoItems={infoItems} />

      {/* Edit Profile Modal */}
      <Modal
        open={openEditModal}
        onClose={handleEditClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={openEditModal}>
          <Box
            sx={{
              position: 'absolute' as const,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: theme.palette.background.paper,
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <EditProfileForm onClose={handleEditClose} />
          </Box>
        </Fade>
      </Modal>
    </StyledPaper>
  );
};

export default Profile;
