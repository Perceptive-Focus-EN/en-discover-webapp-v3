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

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { settings, isLoading, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSettingsUpdate = async (category: string, newSettings: Partial<SettingsState>) => {
    try {
      await updateSettings(category, newSettings);
    } catch (error) {
      console.error(`Failed to update ${category} settings:`, error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load settings. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Notifications" />
          <Tab label="Privacy" />
          <Tab label="Style" />
          <Tab label="Overseer Invites" />
          <Tab label="API Access" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <NotificationSettings 
            settings={settings.notifications}
            onUpdate={(newSettings) => handleSettingsUpdate('notifications', { notifications: newSettings })}
            isLoading={isLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PrivateSettings 
            settings={settings.private}
            onUpdate={(newSettings) => handleSettingsUpdate('private', { private: newSettings })}
            isLoading={isLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <StyleSettings 
            settings={settings.style}
            onUpdate={(newSettings) => handleSettingsUpdate('style', { style: newSettings })}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <OverseerInviteSettings 
            settings={settings.overseerInvites}
            onUpdate={(newSettings) => handleSettingsUpdate('overseerInvites', { overseerInvites: newSettings })}
            isLoading={isLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <ApiAccessSettings
            settings={settings.apiAccess}
            onUpdate={(newSettings) => handleSettingsUpdate('apiAccess', { apiAccess: newSettings })}
            isLoading={isLoading}
          />
        </TabPanel>
        
      </Paper>
    </Box>
  );
};

export default SettingsPage;