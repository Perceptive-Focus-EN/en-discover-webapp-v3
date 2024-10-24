// src/utils/SnackbarManager.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { messageHandler } from '../MonitoringSystem/managers/FrontendMessageHandler';

interface SnackbarContextType {
  showMessage: (message: string, severity: 'error' | 'warning' | 'info' | 'success') => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('info');

  useEffect(() => {
    // Initialize messageHandler with our showMessage function
    messageHandler.init((message, severity) => {
      setMessage(message);
      setSeverity(severity);
      setOpen(true);
    });
  }, []);

  const showMessage = (msg: string, sev: 'error' | 'warning' | 'info' | 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert 
          onClose={handleClose} 
          severity={severity} 
          sx={{ width: '100%' }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};