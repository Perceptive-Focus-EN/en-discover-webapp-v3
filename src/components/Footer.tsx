import React, { useState, useCallback, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { ItemMenu, NavItem } from './ItemMenu';
import Logout from './Auth/Logout';
import { useAuth } from '@/contexts/AuthContext';
import { ExtendedUserInfo } from '../types/User/interfaces';
import ClientOnly from './ClientOnly';
import AvatarComponent from './Uploads/AvatarComponent';
import MessagingDrawer from './Messaging/MessagingDrawer';

const SwipeableDrawer = dynamic(() => import('@mui/material/SwipeableDrawer'), { ssr: false });
const Dialog = dynamic(() => import('@mui/material/Dialog'), { ssr: false });
const DialogContent = dynamic(() => import('@mui/material/DialogContent'), { ssr: false });
const NotificationsDrawer = dynamic(() => import('./Notifications/NotificationsDrawer'), { ssr: false });
const StoreDrawer = dynamic(() => import('./Store/StoreDrawer'), { ssr: false });
const NotificationBadge = dynamic(() => import('./Notifications/NotificationBadge'), { ssr: false });

interface FooterProps {
  currentAccount: ExtendedUserInfo;
}

const Footer: React.FC<FooterProps> = ({ currentAccount }) => {
  // Theme and responsive hooks
  const theme = useTheme();
  const isMobileQuery = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  // Auth hooks
  const { user, loading } = useAuth();

  // State hooks - declare ALL hooks at the top level
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [activeDrawerComponent, setActiveDrawerComponent] = useState<React.ReactNode | null>(null);

  const getDefaultNavigationItems = () => [
    { id: 1, name: 'AccessKeyCreationPage', icon: <DashboardIcon />, path: '/' },
    { id: 2, name: 'Resources', icon: <ResourcesIcon />, path: '/resources' },
    { id: 3, name: 'Friends', icon: <FriendsIcon />, path: '/friends' },
    { id: 4, name: 'Consultation', icon: <ConsultationIcon />, path: '/consultation' },
    { id: 5, name: 'More', icon: <MoreIcon />, onClick: () => setIsDrawerOpen(true) },
  ];

  const [mainNavigationItems, setMainNavigationItems] = useState<NavItem[]>(getDefaultNavigationItems);

  // All useEffect hooks
  useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!user) {
      setIsLogoutDialogOpen(false);
    }
  }, [user]);

  useEffect(() => {
    setIsMobile(isMobileQuery);
  }, [isMobileQuery]);

  // Callbacks
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setActiveDrawerComponent(null);
  }, []);

  const handleItemClick = useCallback((item: NavItem) => {
    if (item.path) {
      router.push(item.path);
    } else if (item.onClick) {
      item.onClick();
    }
  }, [router]);

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setMainNavigationItems((prevItems) => {
      const updatedItems = [...prevItems];
      const [removed] = updatedItems.splice(dragIndex, 1);
      updatedItems.splice(hoverIndex, 0, removed);
      return updatedItems;
    });
  }, []);

  const handleLogoutClick = useCallback(() => {
    setIsDrawerOpen(false);
    setIsLogoutDialogOpen(true);
  }, []);

  // Early return checks - after all hooks
  if (!isInitialized || loading || !user || !currentAccount) {
    return null;
  }

  // Memoized additional items
  const additionalItems: NavItem[] = [
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
        setActiveDrawerComponent(<MessagingDrawer open={isDrawerOpen} onClose={handleDrawerClose} />);
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
  ];

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
          transition: 'all 0.3s ease-in-out',
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
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <IconButton 
                onClick={handleLogoutClick} 
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
          <Logout />
        </DialogContent>
      </Dialog>
    </ClientOnly>
  );
};

export default React.memo(Footer);