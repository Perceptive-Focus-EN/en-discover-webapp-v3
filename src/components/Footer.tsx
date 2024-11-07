// src/components/Footer.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import {
  Dashboard as DashboardIcon,
  Book as ResourcesIcon,
  People as FriendsIcon,
  Headset as ConsultationIcon,
  MoreHoriz as MoreIcon,
  Settings as SettingsIcon,
  RssFeed as FeedIcon,
  Logout as LogoutIcon,
  Chat as ChatIcon,
  ShoppingBag as StoreIcon,
  Notifications as NotificationsIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { ItemMenu, NavItem } from './ItemMenu'; // Import both ItemMenu and NavItem
import { useAuth } from '@/contexts/AuthContext';
import { ExtendedUserInfo } from '../types/User/interfaces';
import ClientOnly from './ClientOnly';
import AvatarComponent from './Uploads/AvatarComponent';
import MessagingDrawer from './Messaging/MessagingDrawer';
import { FileUploader } from './FileUploader';

// Dynamic imports
const SwipeableDrawer = dynamic(() => import('@mui/material/SwipeableDrawer'), { ssr: false });
const Dialog = dynamic(() => import('@mui/material/Dialog'), { ssr: false });
const DialogContent = dynamic(() => import('@mui/material/DialogContent'), { ssr: false });
const NotificationsDrawer = dynamic(() => import('./Notifications/NotificationsDrawer'), { ssr: false });
const StoreDrawer = dynamic(() => import('./Store/StoreDrawer'), { ssr: false });
const NotificationBadge = dynamic(() => import('./Notifications/NotificationBadge'), { ssr: false });

interface FooterProps {
  currentAccount: ExtendedUserInfo;
}


// Define fixed IDs that can't be dragged
const FIXED_NAV_IDS = [1, 5]; // Home and More buttons


const Footer: React.FC<FooterProps> = ({ currentAccount }) => {
  const theme = useTheme();
  const isMobileQuery = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // State
    const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [activeDrawerComponent, setActiveDrawerComponent] = useState<React.ReactNode | null>(null);

  const getDefaultNavigationItems = useCallback(() => [
    { id: 1, name: 'Home', icon: <DashboardIcon />, path: '/' },
    { id: 2, name: 'Resources', icon: <ResourcesIcon />, path: '/resources' },
    { id: 3, name: 'Friends', icon: <FriendsIcon />, path: '/friends' },
    { id: 4, name: 'Consultation', icon: <ConsultationIcon />, path: '/consultation' },
    { id: 5, name: 'More', icon: <MoreIcon />, onClick: () => setIsDrawerOpen(true) },
  ] as NavItem[], [setIsDrawerOpen]);


  const [mainNavigationItems, setMainNavigationItems] = useState<NavItem[]>(() => 
    getDefaultNavigationItems()
  );

    // Handlers
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setActiveDrawerComponent(null);
  }, []);


  // Additional items for drawer
  const additionalItems: NavItem[] = useMemo(() => [
    {
      id: 6,
      name: 'Notifications',
      icon: <NotificationBadge icon={<NotificationsIcon />} />,
      onClick: () => {
        setActiveDrawerComponent(
          <NotificationsDrawer open={isDrawerOpen} onClose={handleDrawerClose} />
        );
        setIsDrawerOpen(true);
      },
    },
    {
      id: 8,
      name: `${currentAccount.firstName} ${currentAccount.lastName}`,
      icon: (
        <AvatarComponent 
          user={{
            avatarUrl: currentAccount.avatarUrl,
            firstName: currentAccount.firstName,
            lastName: currentAccount.lastName
          }}
          size={24}
        />
      ),
      path: '/account',
    },
    { id: 9, name: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { id: 10, name: 'Feed', icon: <FeedIcon />, path: '/feed' },
    {
      id: 11,
      name: 'Messaging',
      icon: <ChatIcon />,
      onClick: () => {
        setActiveDrawerComponent(
          <MessagingDrawer open={isDrawerOpen} onClose={handleDrawerClose} />
        );
        setIsDrawerOpen(true);
      },
    },
    {
      id: 12,
      name: 'Store',
      icon: <StoreIcon />,
      onClick: () => {
        setActiveDrawerComponent(
          <StoreDrawer open={isDrawerOpen} onClose={handleDrawerClose} />
        );
        setIsDrawerOpen(true);
      },
    },
    {
        id: 13,
        name: 'Upload',
        icon: <CloudUploadIcon />, // Import this from @mui/icons-material
        onClick: () => {
            setActiveDrawerComponent(
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Upload Files
                    </Typography>
                    <FileUploader 
                        userId={currentAccount.userId} 
                        tenantId={currentAccount.tenants.associations.tenantId.toString()}
                    />
                </Box>
            );
            setIsDrawerOpen(true);
      },
    },
  ], [isDrawerOpen, handleDrawerClose, setActiveDrawerComponent, currentAccount]);



  // Effects
  useEffect(() => {
    if (!loading && !isInitialized) setIsInitialized(true);
    }, [loading, isInitialized]);

  useEffect(() => {
    if (!user) {
      setIsLogoutDialogOpen(false);
    }
  }, [user]);

  useEffect(() => {
    setIsMobile(isMobileQuery);
  }, [isMobileQuery]);

  const handleItemClick = useCallback((item: NavItem) => {
    if (item.path) {
      router.push(item.path);
    } else if (item.onClick) {
      item.onClick();
    }
  }, [router]);

    const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setMainNavigationItems((prevItems) => {
      if (!prevItems || dragIndex < 0 || hoverIndex < 0 || 
          dragIndex >= prevItems.length || hoverIndex >= prevItems.length) return prevItems;

      const dragItem = prevItems[dragIndex];
      const hoverItem = prevItems[hoverIndex];

      if (!dragItem || !hoverItem || FIXED_NAV_IDS.includes(dragItem.id) || FIXED_NAV_IDS.includes(hoverItem.id)) {
        return prevItems;
      }

      const updatedItems = [...prevItems];
      const [removed] = updatedItems.splice(dragIndex, 1);
      updatedItems.splice(hoverIndex, 0, removed);

      return updatedItems;
    });
    }, [FIXED_NAV_IDS]);

  const handleLogoutClick = useCallback(async () => {
    setIsDrawerOpen(false);
    setIsLogoutDialogOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  }, [logout]);


  if (!isInitialized || loading || !user || !currentAccount) {
    return null;
  }

  return (
    <ClientOnly>
      <Box
        component="footer"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.secondary',
          borderTop: `1px solid ${theme.palette.divider}`,
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          transition: theme.transitions.create('all', {
            duration: theme.transitions.duration.standard,
          }),
          py: 1,
        }}
        className="animate-fade-in-up"
      >
        <ItemMenu
          items={mainNavigationItems}
          moveItem={moveItem}
          onItemClick={handleItemClick}
          mainNavCount={5}
        />
      </Box>

      <SwipeableDrawer
        anchor="bottom"
        open={isDrawerOpen}
        onClose={handleDrawerClose}
        onOpen={() => setIsDrawerOpen(true)}
        disableSwipeToOpen={false}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            bgcolor: 'background.paper',
            py: 2,
          },
        }}
      >
        {activeDrawerComponent || (
          <Box className="animate-fade-in">
            <ItemMenu
              items={[...mainNavigationItems, ...additionalItems]}
              moveItem={moveItem}
              onItemClick={handleItemClick}
              mainNavCount={5}
              isMainNavigation={false} // Set to false for drawer content
            />
            <Box 
              sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'center',
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 2,
              }}
            >
              <IconButton 
                onClick={() => setIsLogoutDialogOpen(true)} 
                color="primary"
                className="transition-all hover:scale-105"
              >
                <LogoutIcon />
                <Typography variant="caption" sx={{ ml: 1 }}>
                  Logout
                </Typography>
              </IconButton>
            </Box>
          </Box>
        )}
      </SwipeableDrawer>

      <Dialog
        open={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        aria-labelledby="logout-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogContent className="animate-fade-in">
          <IconButton onClick={handleLogoutClick} color="primary">
            <LogoutIcon />
            <Typography variant="caption" sx={{ ml: 1 }}>
              Confirm Logout
            </Typography>
          </IconButton>
        </DialogContent>
      </Dialog>
    </ClientOnly>
  );
};

export default React.memo(Footer);