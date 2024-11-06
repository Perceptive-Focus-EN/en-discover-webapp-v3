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
import { ExtendedUserInfo, User } from '@/types/User/interfaces';
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
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [currentAccount, setCurrentAccount] = useState<ExtendedUserInfo | null>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  // Memoized current account update function
  const updateCurrentAccount = useCallback((tenantId: string) => {
    if (!user?.tenants?.associations) return;
    
    const association = user.tenants.associations[tenantId];
    if (!association || association.status !== 'active') return;

    // Create ExtendedUserInfo with current tenant context
    const enhancedUser: ExtendedUserInfo = {
      ...user,
      tenants: {
        ...user.tenants,
        context: {
          ...user.tenants.context,
          currentTenantId: tenantId
        }
      }
    };

    setCurrentAccount(enhancedUser);
  }, [user]);

  // Authentication and account setup effect
  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      router.push('/login');
      return;
    }

    if (user?.tenants?.context?.currentTenantId && !currentAccount) {
      updateCurrentAccount(user.tenants.context.currentTenantId);
    }

    setIsAuthChecked(true);
  }, [user, loading, isPublicRoute, router, currentAccount, updateCurrentAccount]);

  // Tenant switching handler with error boundary
  const handleAccountChange = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      await refreshUser();  // This will get fresh user data with new tenant context
      updateCurrentAccount(tenantId);
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    }
  };

  // Loading state
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

  // Public routes render without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Don't render layout without proper auth and tenant context
  if (!user || !currentAccount) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: theme.palette.text.primary,
        fontFamily: settings?.style?.font || theme.typography.fontFamily,
        fontSize: settings?.style?.fontSize || theme.typography.fontSize,
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar 
        }}
      >
        <Header
          currentAccount={currentAccount}
          onAccountChange={handleAccountChange}
          user={user}
          onMessagingToggle={(open) => setIsMessagingOpen(open)}
        />
      </Box>
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          pt: '64px', // Header height
          pb: '56px', // Footer height
          px: { xs: 2, sm: 3, md: 4 },
          minHeight: 'calc(100vh - 120px)', // Account for header and footer
        }}
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
          zIndex: theme.zIndex.appBar 
        }}
      >
        {currentAccount && <Footer currentAccount={currentAccount} />}
      </Box>

      {/* AI Assistant for mobile */}
      {!isDesktop && (
        <Fab
          color="primary"
          onClick={toggleAIAssistant}
          sx={{
            position: 'fixed',
            bottom: 70,
            right: 20,
            zIndex: theme.zIndex.fab,
          }}
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

      {/* AI Assistant Modal */}
      {state.isActive && (
        <>
          <Box
            onClick={toggleAIAssistant}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: theme.zIndex.modal - 1,
            }}
          />
          <Box
            sx={{
              position: 'fixed',
              top: '80px',
              right: 20,
              zIndex: theme.zIndex.modal,
              maxWidth: '90vw',
              maxHeight: 'calc(100vh - 100px)',
              overflow: 'auto',
              p: 2,
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