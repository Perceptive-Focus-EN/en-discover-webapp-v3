// components/settings/PrivateSettings.tsx

import React from 'react';
import { PrivateSettings as PrivateSettingsType } from '../../types/Settings/interfaces';
import { 
  FormControlLabel, 
  Switch, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl,
  InputLabel,
  Grid,
  SelectChangeEvent
} from '@mui/material';

interface PrivateSettingsProps {
  settings: PrivateSettingsType | undefined;
  onUpdate: (newSettings: PrivateSettingsType) => void;
}

const PrivateSettings: React.FC<PrivateSettingsProps> = ({ settings, onUpdate }) => {
  if (!settings) return null;

  const handleSecurityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    onUpdate({
      ...settings,
      security: { ...settings.security, [name]: checked }
    });
  };

  const handlePrivacyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    onUpdate({
      ...settings,
      privacy: { ...settings.privacy, [name]: checked }
    });
  };

  const handleVisibilityChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    onUpdate({
      ...settings,
      privacy: {
        ...settings.privacy,
        visibility: { ...settings.privacy.visibility, [name as string]: value as string }
      }
    });
  };

  return (
    <div>
      <Typography variant="h6" gutterBottom>Security Settings</Typography>
      <FormControlLabel
        control={<Switch checked={settings.security.twoFactorAuthEnabled} onChange={handleSecurityChange} name="twoFactorAuthEnabled" />}
        label="Two-Factor Authentication"
      />
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Privacy Settings</Typography>
      <FormControlLabel
        control={<Switch checked={settings.privacy.dataSharing} onChange={handlePrivacyChange} name="dataSharing" />}
        label="Data Sharing"
      />
      <FormControlLabel
        control={<Switch checked={settings.privacy.activityTracking} onChange={handlePrivacyChange} name="activityTracking" />}
        label="Activity Tracking"
      />
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Visibility Settings</Typography>
      <Grid container spacing={2}>
        {Object.entries(settings.privacy.visibility).map(([key, value]) => (
          <Grid item xs={12} sm={6} key={key}>
            <FormControl fullWidth>
              <InputLabel id={`visibility-${key}-label`}>{key.charAt(0).toUpperCase() + key.slice(1)} Visibility</InputLabel>
              <Select
                labelId={`visibility-${key}-label`}
                value={value}
                onChange={handleVisibilityChange}
                name={key}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="tenant-only">Tenant Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default PrivateSettings;