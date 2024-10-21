// pages/settings.tsx

import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import {
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import NotificationSettings from '../components/Settings/NotificationSettings';
import PrivateSettings from '../components/Settings/PrivateSettings';
import StyleSettings from '../components/Settings/StyleSettings';
import OverseerInviteSettings from '../components/Settings/OverseerInviteSettings';
import ApiAccessSettings from '../components/Settings/ApiAccessSettings';
import { SettingsState } from '@/types/Settings/interfaces';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const defaultSettings: SettingsState = {
    notifications: { email: false, sms: false, inApp: false },
    private: {
        security: { twoFactorAuthEnabled: false, passwordLastChanged: new Date(), activeSessions: [] },
        privacy: {
            dataSharing: false,
            activityTracking: false,
            visibility: { profile: 'private', email: 'private', phone: 'private', location: 'private', age: 'private', dob: 'private' }
        }
    },
    style: { theme: 'light', language: 'en', font: 'default', fontSize: 16, colorScheme: 'default' },
    overseerInvites: { pendingInvites: [], inviteHistory: [] },
    apiAccess: { apiKeys: [], permissions: [] },
    id: '',
    userId: '',
    tenantId: '',
    avatarUrl: '',
    faq: { questions: [], lastUpdated: new Date() },
    appRating: { currentRating: 0, feedbackHistory: [] },
    terms: { version: '', lastAccepted: new Date(), content: '' },
    privacyPolicy: { version: '', lastAccepted: new Date(), content: '' },
    tenantInfo: {
        roles: [],
        resourceAllocation: {
            storageLimit: 0,
            apiUsageLimit: 0
        }
    },
    isLoading: false,
    error: null
};

const SettingsPage: React.FC = () => {
  const { settings, isLoading, error, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSettingsUpdate = async (category: string, newSettings: Partial<SettingsState>) => {
    try {
      await updateSettings(category, { [category]: newSettings });
      setSnackbar({ open: true, message: 'Settings updated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update settings', severity: 'error' });
    }
  };

  const currentSettings = settings || defaultSettings;

  return (
    <div style={{ maxWidth: 'lg', margin: '0 auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="Notifications" />
          <Tab label="Privacy" />
          <Tab label="Style" />
          <Tab label="Overseer Invites" />
          <Tab label="API Access" />
        </Tabs>
        <TabPanel value={activeTab} index={0}>
          <NotificationSettings
            settings={currentSettings.notifications}
            onUpdate={(newSettings) => handleSettingsUpdate('notifications', { notifications: newSettings })}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <PrivateSettings
            settings={currentSettings.private}
            onUpdate={(newSettings) => handleSettingsUpdate('private', { private: newSettings })}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <StyleSettings
            settings={currentSettings.style}
            onUpdate={(newSettings) => handleSettingsUpdate('style', { style: newSettings })}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <OverseerInviteSettings
            settings={currentSettings.overseerInvites}
            onUpdate={(newSettings) => handleSettingsUpdate('overseerInvites', { overseerInvites: newSettings })}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <ApiAccessSettings
            settings={currentSettings.apiAccess}
            onUpdate={(newSettings) => handleSettingsUpdate('apiAccess', { apiAccess: newSettings })}
          />
        </TabPanel>
      </Paper>
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SettingsPage;
