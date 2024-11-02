// src/components/Settings/ApiAccessSettings.tsx
import React, { useState } from 'react';
import { ApiAccessSettings as ApiAccessSettingsType, ApiKeyInfo } from '../../types/Settings/interfaces';
import {
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  CircularProgress,
  Box
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, FileCopy as FileCopyIcon } from '@mui/icons-material';
import SecurityBadgePreview from '../AccessKeyForms/SecurityBadgePreview';
import { useRouter } from 'next/router';
import { useSettings } from '@/contexts/SettingsContext';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';


interface ApiAccessSettingsProps {
  settings: ApiAccessSettingsType;
  onUpdate: (newSettings: ApiAccessSettingsType) => Promise<void>;
  isLoading?: boolean;
}

const ApiAccessSettings: React.FC<ApiAccessSettingsProps> = ({
  settings,
  onUpdate,
  isLoading = false
}) => {
  const router = useRouter();
  const [isNewKeyDialogOpen, setIsNewKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) return null;

    const handleRemovePermission = async (permission: string) => {
    const updatedSettings = {
      ...settings,
      permissions: settings.permissions.filter(p => p !== permission)
    };
    await onUpdate(updatedSettings);
    };
  
    const handleGenerateNewApiKey = async () => {
    const newApiKey: ApiKeyInfo = {
      key: 'new-api-key-' + Date.now(),
      name: newKeyName,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    const updatedSettings = {
      ...settings,
      apiKeys: [...settings.apiKeys, newApiKey]
    };
    await onUpdate(updatedSettings);
    setIsNewKeyDialogOpen(false);
    setNewKeyName('');
  };

  const handleDeleteApiKey = async (keyToDelete: string) => {
    const updatedSettings = {
      ...settings,
      apiKeys: settings.apiKeys.filter(key => key.key !== keyToDelete)
    };
    await onUpdate(updatedSettings);
    };
  
  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    messageHandler.success('API key copied to clipboard');
  };

  const handleManagePermissions = () => {
    router.push('/AccessKeyCreationPage');
  };

    // Rest of the component remains the same, just change settings.apiAccess to settings
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pt: 2 }}>
      <Typography variant="h4" gutterBottom>API Access Settings</Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>API Keys</Typography>
        {settings.apiKeys.map((apiKey, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              {apiKey.name || 'Unnamed Key'}
            </Typography>
            <Tooltip title="Copy API Key">
              <IconButton onClick={() => handleCopyApiKey(apiKey.key)}>
                <FileCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete API Key">
              <IconButton onClick={() => handleDeleteApiKey(apiKey.key)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setIsNewKeyDialogOpen(true)}
          sx={{ mt: 2 }}
        >
          Generate New API Key
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>Permissions</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {settings.permissions.map((permission, index) => (
            <Chip
              key={index}
              label={permission}
              onDelete={() => handleRemovePermission(permission)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleManagePermissions}
        >
          Manage Permissions
        </Button>
      </Box>

      {settings.apiKeys.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Security Badge Preview</Typography>
          <SecurityBadgePreview
            name="API User"
            role="API Access"
            accessLevel="API"
            accountType="API"
            avatarUrl=""
            userId={settings.apiKeys[0].key}
            tenantId=""
            accessKey={settings.apiKeys[0].key}
            nfcId=""
          />
        </Box>
      )}

      <Dialog open={isNewKeyDialogOpen} onClose={() => setIsNewKeyDialogOpen(false)}>
        <DialogTitle>Generate New API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="API Key Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewKeyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateNewApiKey} variant="contained" color="primary">
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiAccessSettings;