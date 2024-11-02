// src/components/Settings/NotificationSettings.tsx
import React from 'react';
import { NotificationSettings as NotificationSettingsType } from '../../types/Settings/interfaces';
import { 
  FormControlLabel, 
  Switch, 
  Typography, 
  CircularProgress,
  Box 
} from '@mui/material';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onUpdate: (newSettings: NotificationSettingsType) => Promise<void>;
  isLoading: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onUpdate,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return null;
  }

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    await onUpdate({
      ...settings,
      [name]: checked
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2,
      maxWidth: 'sm',
      mx: 'auto',
      p: 2 
    }}>
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.email}
            onChange={handleChange}
            name="email"
          />
        }
        label="Email Notifications"
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.sms}
            onChange={handleChange}
            name="sms"
          />
        }
        label="SMS Notifications"
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.inApp}
            onChange={handleChange}
            name="inApp"
          />
        }
        label="In-App Notifications"
      />
    </Box>
  );
};

export default NotificationSettings;