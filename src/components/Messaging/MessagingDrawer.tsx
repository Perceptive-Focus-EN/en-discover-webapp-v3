import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { Message, MessagingDrawerProps } from './types/messaging';

const MessagingDrawer: React.FC<MessagingDrawerProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { currentTenant } = useGlobalState();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (open && user) {
      loadContacts();
    }
  }, [open, user]);

  const loadContacts = async () => {
    try {
      // In a real implementation, this would fetch from your API
      // For now, using dummy data
      const dummyContacts = [
        { id: '1', name: 'John Doe', avatar: '', lastMessage: 'Hello' },
        { id: '2', name: 'Jane Smith', avatar: '', lastMessage: 'Hey there' },
      ];
      setContacts(dummyContacts);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'messaging',
        'contacts_load',
        Date.now(),
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { tenantId: currentTenant?.tenantId }
      );
    } catch (error) {
      messageHandler.error('Failed to load contacts');
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedContact) return;

    try {
      // In a real implementation, this would send to your API
      const newMessage = {
        id: Date.now().toString(),
        senderId: user!.userId,
        receiverId: selectedContact,
        content: message,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'messaging',
        'message_sent',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { tenantId: currentTenant?.tenantId }
      );
    } catch (error) {
      messageHandler.error('Failed to send message');
    }
  }, [message, selectedContact, user, currentTenant]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          bgcolor: 'background.paper',
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Messages</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        {/* Contacts List */}
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {contacts.map((contact) => (
            <ListItem
              key={contact.id}
              button
              selected={selectedContact === contact.id}
              onClick={() => setSelectedContact(contact.id)}
            >
              <ListItemAvatar>
                <Avatar src={contact.avatar}>{contact.name[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={contact.name}
                secondary={contact.lastMessage}
              />
            </ListItem>
          ))}
        </List>

        {/* Message Input */}
        {selectedContact && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSendMessage} disabled={!message.trim()}>
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default MessagingDrawer;