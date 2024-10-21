import React, { useState } from 'react';
import { Drawer, Box, Typography, Button, Tabs, Tab, IconButton } from '@mui/material';
import NotificationSection from './NotificationSection';
import { useNotification } from './contexts/NotificationContext';
import CloseIcon from '@mui/icons-material/Close';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose }) => {
  const { newNotifications, notifications, loadNotifications, markAsRead, markAllAsRead } = useNotification();
  const [activeTab, setActiveTab] = useState(0);

  React.useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 375, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Notifications</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="New" />
          <Tab label="All" />
        </Tabs>
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {activeTab === 0 && <NotificationSection notifications={newNotifications} onMarkAsRead={markAsRead} />}
          {activeTab === 1 && <NotificationSection notifications={notifications} onMarkAsRead={markAsRead} />}
        </Box>
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button fullWidth variant="outlined" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationDrawer;