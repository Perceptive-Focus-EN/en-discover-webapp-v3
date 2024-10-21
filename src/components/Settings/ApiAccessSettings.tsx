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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, FileCopy as FileCopyIcon } from '@mui/icons-material';
import SecurityBadgePreview from '../AccessKeyForms/SecurityBadgePreview';
import { useRouter } from 'next/router';

interface ApiAccessSettingsProps {
  settings: ApiAccessSettingsType | undefined;
  onUpdate: (newSettings: ApiAccessSettingsType) => void;
}

const ApiAccessSettings: React.FC<ApiAccessSettingsProps> = ({ settings, onUpdate }) => {
  const router = useRouter();
  const [isNewKeyDialogOpen, setIsNewKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  if (!settings) return null;

  const handleRemovePermission = (permission: string) => {
    const updatedSettings = {
      ...settings,
      permissions: settings.permissions.filter(p => p !== permission)
    };
    onUpdate(updatedSettings);
  };

  const handleGenerateNewApiKey = () => {
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
    onUpdate(updatedSettings);
    setIsNewKeyDialogOpen(false);
    setNewKeyName('');
  };

  const handleDeleteApiKey = (keyToDelete: string) => {
    const updatedSettings = {
      ...settings,
      apiKeys: settings.apiKeys.filter(key => key.key !== keyToDelete)
    };
    onUpdate(updatedSettings);
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    // You might want to show a snackbar or toast notification here
  };

  const handleManagePermissions = () => {
    router.push('/AccessKeyCreationPage');
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', paddingTop: 16 }}>
      <Typography variant="h4" gutterBottom>API Access Settings</Typography>
      
      <div style={{ marginBottom: 16 }}>
        <Typography variant="h6" gutterBottom>API Keys</Typography>
        {settings.apiKeys.map((apiKey, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Typography variant="body1" style={{ flexGrow: 1 }}>{apiKey.name || 'Unnamed Key'}</Typography>
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
          </div>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setIsNewKeyDialogOpen(true)}
          style={{ marginTop: 16 }}
        >
          Generate New API Key
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Typography variant="h6" gutterBottom>Permissions</Typography>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {settings.permissions.map((permission, index) => (
            <Chip
              key={index}
              label={permission}
              onDelete={() => handleRemovePermission(permission)}
              color="primary"
              variant="outlined"
            />
          ))}
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleManagePermissions}
        >
          Manage Permissions
        </Button>
      </div>

      {settings.apiKeys.length > 0 && (
        <div>
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
        </div>
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
          <Button onClick={handleGenerateNewApiKey} variant="contained" color="primary">Generate</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ApiAccessSettings;
