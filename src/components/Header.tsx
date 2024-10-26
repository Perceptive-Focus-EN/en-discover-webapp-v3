import React, { useState, useCallback, useContext, useMemo } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    useTheme,
    SwipeableDrawer,
    useMediaQuery,
    Menu,
} from '@mui/material';
import { Chat as ChatIcon, Menu as MenuIcon } from '@mui/icons-material';
import { ThemeModeContext } from '../pages/_app';
import { useSettings } from '../contexts/SettingsContext';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { useRouter } from 'next/router';
import AvatarComponent from './Uploads/AvatarComponent';
import TenantSwitcher from './TenantSwitcher';
import ThemeToggleIcon from './ui/ThemeToggleIcon';
import { ExtendedUserInfo, User } from '../types/User/interfaces';

interface HeaderProps {
    onAccountChange: (tenantId: string) => void;
    currentAccount: ExtendedUserInfo | null;
    user: User | null;
    onMessagingToggle: (open: boolean) => void; // Added prop for messaging toggle
}

const Header: React.FC<HeaderProps> = ({ onAccountChange, currentAccount, user, onMessagingToggle }) => {
    const { settings, updateTheme } = useSettings();
    const { mode, toggleThemeMode } = useContext(ThemeModeContext);
    const { toggleAIAssistant } = useAIAssistant();
    const theme = useTheme();
    const router = useRouter();
    const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Changed to 'md' to include tablets

    // Handle theme toggle
    const handleThemeToggle = useCallback(() => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        toggleThemeMode();
        updateTheme(newMode);
    }, [mode, toggleThemeMode, updateTheme]);

    // Determine the current page title
    const getPageTitle = useMemo(() => {
        if (!user) {
            return 'EN Discover';
        }
        switch (router.pathname) {
            case '/': return 'Moodboard';
            case '/resources': return 'Resources';
            case '/friends': return 'Friends';
            case '/consultation': return 'Consultation';
            default: return '';
        }
    }, [router.pathname, user]);

    // Handle drawer open for account switching
    const handleOpenAccountDrawer = () => {
        setIsAccountDrawerOpen(true);
    };

    // Handle menu interactions
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Handle messaging toggle using prop function
    const handleMessagingToggle = useCallback(() => {
        onMessagingToggle(true); // Open messaging drawer when toggled
    }, [onMessagingToggle]);

    return (
        <>
            <AppBar
                position="fixed"
                color="default"
                sx={{
                    bgcolor: 'background.paper',
                    boxShadow: theme.shadows[1],
                    transition: 'all 0.3s ease-in-out',
                    mt: 1,
                    borderRadius: 2,
                    width: '100%',
                }}
                className="animate-fade-in-down"
            >
                <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: { xs: 2, sm: 3, md: 4 } }}>
                    {/* Logo & User Details */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {user ? (
                            <>
                                {isMobile ? (
                                    <IconButton 
                                        edge="start" 
                                        color="inherit" 
                                        aria-label="menu" 
                                        onClick={handleOpenAccountDrawer}
                                        className="transition-all hover:scale-105"
                                    >
                                        <MenuIcon />
                                    </IconButton>
                                ) : (
                                    currentAccount && (
                                        <>
                                            <IconButton
                                                onClick={handleMenuOpen}
                                                className="transition-all hover:scale-105"
                                            >
                                                <AvatarComponent
                                                    user={{
                                                        avatarUrl: currentAccount.avatarUrl,
                                                        firstName: user.firstName,
                                                        lastName: user.lastName,
                                                    }}
                                                    size={40}
                                                />
                                            </IconButton>
                                            <Typography variant="body1" color="textPrimary">
                                                {currentAccount.firstName} {currentAccount.lastName}
                                            </Typography>
                                            <Menu
                                                anchorEl={anchorEl}
                                                open={Boolean(anchorEl)}
                                                onClose={handleMenuClose}
                                                PaperProps={{
                                                    sx: {
                                                        bgcolor: 'background.paper',
                                                        borderRadius: 2,
                                                        boxShadow: theme.shadows[3],
                                                    },
                                                }}
                                            >
                                                    <TenantSwitcher onAccountChange={(tenantId) => {
                                                        onAccountChange(tenantId);
                                                        handleMenuClose();
                                                    }} />
                                            </Menu>
                                        </>
                                    )
                                )}
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {getPageTitle}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                EN Discover
                            </Typography>
                        )}
                    </Box>

                    {/* Theme & Chat Icons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ThemeToggleIcon theme={mode} toggleTheme={handleThemeToggle} />
                        {user && !isMobile && (
                            <>
                                <IconButton
                                    color="primary"
                                    sx={{
                                        p: 1,
                                        bgcolor: 'background.paper',
                                        borderRadius: '16px',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        },
                                    }}
                                    className="transition-all hover:scale-105"
                                    onClick={handleMessagingToggle} // Updated to toggle messaging drawer
                                >
                                    <ChatIcon />
                                </IconButton>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    aria-label="AI Assistant"
                                    onClick={toggleAIAssistant}
                                >
                                    <img src="/EN_LightMode.png" alt="EN Logo" style={{ width: 40, height: 40 }} />
                                </IconButton>
                            </>
                        )}
                        {!user && !isMobile && (
                            <IconButton
                                edge="start"
                                color="inherit"
                                aria-label="AI Assistant"
                                onClick={toggleAIAssistant}
                            >
                                <img src="/EN_LightMode.png" alt="EN Logo" style={{ width: 40, height: 40 }} />
                            </IconButton>
                        )}
                    </Box>
                </Toolbar>

                {/* Mobile Drawer for Account Switching */}
                {isMobile && user && (
                    <SwipeableDrawer
                        anchor="bottom"
                        open={isAccountDrawerOpen}
                        onClose={() => setIsAccountDrawerOpen(false)}
                        onOpen={() => setIsAccountDrawerOpen(true)}
                        PaperProps={{
                            sx: {
                                borderTopLeftRadius: 16,
                                borderTopRightRadius: 16,
                                bgcolor: 'background.paper',
                            },
                        }}
                    >
                        <Box className="animate-fade-in p-4">
                            <TenantSwitcher onAccountChange={(tenantId) => {
                                onAccountChange(tenantId);
                                setIsAccountDrawerOpen(false);
                            }} />
                        </Box>
                    </SwipeableDrawer>
                )}
            </AppBar>
        </>
    );
};

export default Header;
