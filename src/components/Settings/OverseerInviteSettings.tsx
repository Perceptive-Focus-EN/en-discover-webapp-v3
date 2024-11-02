// src/components/Settings/OverseerInviteSettings.tsx
import React, { useState } from 'react';
import { 
  OverseerInviteSettings as OverseerInviteSettingsType, 
  InviteInfo, 
  InviteHistoryItem 
} from '../../types/Settings/interfaces';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

interface OverseerInviteSettingsProps {
  settings: OverseerInviteSettingsType;
  onUpdate: (newSettings: OverseerInviteSettingsType) => Promise<void>;
  isLoading: boolean;
}

const OverseerInviteSettings: React.FC<OverseerInviteSettingsProps> = ({ 
  settings,
  onUpdate,
  isLoading
}) => {
  const [open, setOpen] = useState(false);
  const [newInvite, setNewInvite] = useState<InviteInfo>({ 
    email: '', 
    role: '', 
    invitedAt: new Date() 
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) return null;

  const handleInvite = async () => {
    const updatedSettings = {
      ...settings,
      pendingInvites: [...settings.pendingInvites, newInvite]
    };
    await onUpdate(updatedSettings);
    setOpen(false);
    setNewInvite({ email: '', role: '', invitedAt: new Date() });
  };

  const handleRemoveInvite = async (index: number) => {
    const updatedInvites = [...settings.pendingInvites];
    updatedInvites.splice(index, 1);
    await onUpdate({
      ...settings,
      pendingInvites: updatedInvites
    });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Overseer Invites</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setOpen(true)}
          disabled={isLoading}
        >
          Send New Invite
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Pending Invites
        </Typography>
        <List>
          {settings.pendingInvites.map((invite, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleRemoveInvite(index)}
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={invite.email} 
                secondary={`Role: ${invite.role}, Invited At: ${invite.invitedAt.toLocaleString()}`} 
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Invite History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {settings.inviteHistory.map((item: InviteHistoryItem, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={item.email}
                secondary={`Role: ${item.role}, Status: ${item.status}, Date: ${item.date.toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Send New Invite</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Email"
              type="email"
              fullWidth
              value={newInvite.email}
              onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
            />
            <TextField
              label="Role"
              type="text"
              fullWidth
              value={newInvite.role}
              onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleInvite} 
            variant="contained" 
            disabled={!newInvite.email || !newInvite.role || isLoading}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OverseerInviteSettings;