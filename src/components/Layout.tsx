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
import MessagingDrawer from './Messaging/MessagingDrawer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading, refreshUser, switchTenant } = useAuth();
  const { settings } = useSettings();
  const { state, toggleAIAssistant } = useAIAssistant();
  
  const [currentAccount, setCurrentAccount] = useState<ExtendedUserInfo | null>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Public routes that don’t need auth
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  // Authentication check with optimized dependencies
  useEffect(() => {
    if (loading) return;  // Wait for auth to load
    if (!user && !isPublicRoute && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/login').finally(() => setIsRedirecting(false));
    } else if (user?.currentTenantId && !currentAccount) {
      updateCurrentAccount(user.currentTenantId);
    }
    setIsAuthChecked(true);
  }, [user, loading, router.pathname, isPublicRoute, isRedirecting, currentAccount]);

  // Refreshes `currentAccount` if the tenant changes
  const updateCurrentAccount = useCallback((tenantId: string) => {
    if (!user) return;
    const tenant = user.tenantAssociations.find((assoc) => assoc.tenantId === tenantId);
    if (tenant) {
      setCurrentAccount({ ...user, currentTenantId: tenantId });
    }
  }, [user]);

  // Handles tenant switching with error handling
  const handleAccountChange = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      await refreshUser();
      updateCurrentAccount(tenantId);
    } catch (error) {
      console.error('Failed to switch tenant context:', error);
    }
  };

  const handleMessagingToggle = useCallback((open: boolean) => {
    setIsMessagingOpen(open);
  }, []);

  // Ensure auth is checked and user is available before rendering
  if (!isAuthChecked || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Return children only for public routes
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Only render layout if user and tenant are authenticated
  if (!user || !currentAccount) {
    return null;
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
      {/* Header */}
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
          onMessagingToggle={handleMessagingToggle}
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
          mt: '64px',
          mb: '56px',
          transition: 'all 0.3s ease-in-out',
        }}
        className="animate-fade-in-up"
      >
        {children}
      </Box>

      {/* Footer */}
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
        {currentAccount && <Footer currentAccount={currentAccount} />}
      </Box>

      {/* AI Assistant (Mobile Only) */}
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

      {/* AI Assistant Backdrop */}
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

      {/* Messaging Drawer */}
      <MessagingDrawer 
        open={isMessagingOpen} 
        onClose={() => setIsMessagingOpen(false)} 
      />
    </Box>
  );
};

export default Layout;
