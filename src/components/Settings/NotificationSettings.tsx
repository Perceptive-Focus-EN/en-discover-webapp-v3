// components/settings/NotificationSettings.tsx

import React from 'react';
import { NotificationSettings as NotificationSettingsType } from '../../types/Settings/interfaces';
import { FormControlLabel, Switch, Typography } from '@mui/material';

interface NotificationSettingsProps {
  settings: NotificationSettingsType | undefined;
  onUpdate: (newSettings: NotificationSettingsType) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onUpdate }) => {
  if (!settings) return null;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    onUpdate({ ...settings, [name]: checked });
  };

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>
      <FormControlLabel
        control={<Switch checked={settings.email} onChange={handleChange} name="email" />}
        label="Email Notifications"
      />
      <FormControlLabel
        control={<Switch checked={settings.sms} onChange={handleChange} name="sms" />}
        label="SMS Notifications"
      />
      <FormControlLabel
        control={<Switch checked={settings.inApp} onChange={handleChange} name="inApp" />}
        label="In-App Notifications"
      />
    </div>
  );
};

export default NotificationSettings;