import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  useTheme,
  CircularProgress,
  Fab,
  useMediaQuery,
} from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { ExtendedUserInfo } from '@/types/User/interfaces';
import { useRouter } from 'next/router';
import AIAssistant from './AIAssistant';
import Image from 'next/image';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import MessagingDrawer from './Messaging/MessagingDrawer'; // New import

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading, refreshUser, switchTenant } = useAuth();
  const { settings } = useSettings();
  const [currentAccount, setCurrentAccount] = useState<ExtendedUserInfo | null>(null);
  const { state, toggleAIAssistant } = useAIAssistant();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // New state for messaging drawer
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user?.currentTenantId) {
        updateCurrentAccount(user.currentTenantId);
      }
    }
  }, [user, loading, router]);

  const updateCurrentAccount = (tenantId: string) => {
    const currentTenant = user?.tenantAssociations.find(
      (assoc) => assoc.tenantId === tenantId
    );
    if (currentTenant && user) {
      setCurrentAccount({
        ...user,
        currentTenantId: tenantId,
        tenantAssociations: user.tenantAssociations,
        role: user.role || 'defaultRole',
      });
    }
  };

  const handleAccountChange = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      await refreshUser();
      updateCurrentAccount(tenantId);
    } catch (error) {
      console.error('Failed to switch tenant context:', error);
    }
  };

  // New function to handle messaging drawer toggle
  const handleMessagingToggle = useCallback((open: boolean) => {
    setIsMessagingOpen(open);
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
        className="animate-fade-in"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{
        color: theme.palette.text.primary,
        overflow: 'hidden',
        fontFamily: settings?.style?.font || theme.typography.fontFamily,
        fontSize: settings?.style?.fontSize || theme.typography.fontSize,
        bgcolor: 'background.default',
      }}
      className="animate-fade-in"
    >
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          transition: 'all 0.3s ease-in-out',
        }}
        className="animate-fade-in-down"
      >
        <Header
          currentAccount={currentAccount}
          onAccountChange={handleAccountChange}
          user={user}
          onMessagingToggle={handleMessagingToggle} // Pass the toggle handler to Header
        />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 4, md: 6 },
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 10, sm: 11 },
          overflowY: 'auto',
          display: 'block',
          mt: user && currentAccount ? '64px' : 0,
          mb: '56px',
          transition: 'all 0.3s ease-in-out',
        }}
        className="animate-fade-in-up"
      >
        {children}
      </Box>

      {/* Footer */}
      {user && currentAccount && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
          }}
          className="animate-fade-in-up"
        >
          <Footer currentAccount={currentAccount} />
        </Box>
      )}

      {/* AI Assistant Toggle (Mobile Only) */}
      {!isDesktop && (
        <Fab
          color="primary"
          aria-label="AI Assistant"
          sx={{
            position: 'fixed',
            bottom: { xs: 70, sm: 70 },
            right: 20,
            zIndex: theme.zIndex.fab + 1,
            width: 60,
            height: 60,
            borderRadius: '50%',
            overflow: 'hidden',
            p: 0,
          }}
          onClick={toggleAIAssistant}
        >
          <Image
            src="/EN_LightMode.png"
            alt="EN Logo"
            width={60}
            height={60}
            style={{ objectFit: 'cover' }}
          />
        </Fab>
      )}

      {/* AI Assistant Backdrop & Component */}
      {state.isActive && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: theme.zIndex.modal - 1,
            }}
            onClick={toggleAIAssistant}
          />
          <Box
            sx={{
              position: 'fixed',
              top: '80px',
              right: 20,
              zIndex: theme.zIndex.modal,
              p: 2,
              maxWidth: '90vw',
              maxHeight: 'calc(100vh - 100px)',
              overflow: 'auto',
            }}
          >
            <AIAssistant />
          </Box>
        </>
      )}

      {/* Messaging Drawer at Layout level */}
      {user && (
        <MessagingDrawer 
          open={isMessagingOpen} 
          onClose={() => setIsMessagingOpen(false)} 
        />
      )}
    </Box>
  );
};

export default Layout;
