// components/settings/OverseerInviteSettings.tsx

import React, { useState } from 'react';
import { OverseerInviteSettings as OverseerInviteSettingsType, InviteInfo, InviteHistoryItem } from '../../types/Settings/interfaces';
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
  DialogActions
} from '@mui/material';

interface OverseerInviteSettingsProps {
  settings: OverseerInviteSettingsType | undefined;
  onUpdate: (newSettings: OverseerInviteSettingsType) => void;
}

const OverseerInviteSettings: React.FC<OverseerInviteSettingsProps> = ({ settings, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [newInvite, setNewInvite] = useState<InviteInfo>({ email: '', role: '', invitedAt: new Date() });

  if (!settings) return null;

  const handleInvite = () => {
    const updatedSettings = {
      ...settings,
      pendingInvites: [...settings.pendingInvites, newInvite]
    };
    onUpdate(updatedSettings);
    setOpen(false);
    setNewInvite({ email: '', role: '', invitedAt: new Date() });
  };

  return (
    <div>
      <Typography variant="h6" gutterBottom>Overseer Invites</Typography>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        Send New Invite
      </Button>
      
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>Pending Invites</Typography>
      <List>
        {settings.pendingInvites.map((invite, index) => (
          <ListItem key={index}>
            <ListItemText primary={invite.email} secondary={`Role: ${invite.role}, Invited At: ${invite.invitedAt.toLocaleString()}`} />
          </ListItem>
        ))}
      </List>
      
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>Invite History</Typography>
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

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Send New Invite</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newInvite.email}
            onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Role"
            type="text"
            fullWidth
            value={newInvite.role}
            onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite}>Send Invite</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OverseerInviteSettings;