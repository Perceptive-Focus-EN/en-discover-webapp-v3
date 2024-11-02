// src/components/Settings/PrivateSettings.tsx
import React from 'react';
import {
  FormControlLabel,
  Switch,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  SelectChangeEvent,
  Box,
  CircularProgress
} from '@mui/material';
import { PrivateSettings as PrivateSettingsType } from '../../types/Settings/interfaces';

interface PrivateSettingsProps {
  settings: PrivateSettingsType;
  onUpdate: (newSettings: PrivateSettingsType) => Promise<void>;
  isLoading: boolean;
}

const PrivateSettings: React.FC<PrivateSettingsProps> = ({
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

  if (!settings) return null;

  const handleSecurityChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    await onUpdate({
      ...settings,
      security: {
        ...settings.security,
        [name]: checked
      }
    });
  };

  const handlePrivacyChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    await onUpdate({
      ...settings,
      privacy: {
        ...settings.privacy,
        [name]: checked
      }
    });
  };

  const handleVisibilityChange = async (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    await onUpdate({
      ...settings,
      privacy: {
        ...settings.privacy,
        visibility: {
          ...settings.privacy.visibility,
          [name]: value
        }
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Security Settings</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={settings.security.twoFactorAuthEnabled}
              onChange={handleSecurityChange}
              name="twoFactorAuthEnabled"
            />
          }
          label="Two-Factor Authentication"
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.privacy.dataSharing}
                onChange={handlePrivacyChange}
                name="dataSharing"
              />
            }
            label="Data Sharing"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.privacy.activityTracking}
                onChange={handlePrivacyChange}
                name="activityTracking"
              />
            }
            label="Activity Tracking"
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Visibility Settings</Typography>
        <Grid container spacing={2}>
          {Object.entries(settings.privacy.visibility).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <FormControl fullWidth>
                <InputLabel id={`visibility-${key}-label`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} Visibility
                </InputLabel>
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
      </Box>
    </Box>
  );
};

export default PrivateSettings;