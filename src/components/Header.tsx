import React, { useState, useCallback, useContext, useMemo } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    useTheme,
    SwipeableDrawer as MuiSwipeableDrawer,
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
import { ExtendedUserInfo, User, TenantAssociation } from '../types/User/interfaces';

interface HeaderProps {
    onAccountChange: (tenantId: string) => void;
    currentAccount: ExtendedUserInfo | null;
    user: User | null;
    onMessagingToggle: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ onAccountChange, currentAccount, user, onMessagingToggle }) => {
    const { updateTheme } = useSettings();
    const { mode, toggleThemeMode } = useContext(ThemeModeContext);
    const { toggleAIAssistant } = useAIAssistant();
    const theme = useTheme();
    const router = useRouter();
    const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Get current tenant association from user context
    const currentTenantAssociation = useMemo(() => {
        if (!currentAccount?.tenants?.context?.currentTenantId || !currentAccount?.tenants?.associations) {
            return null;
        }
        return currentAccount.tenants.associations[currentAccount.tenants.context.currentTenantId];
    }, [currentAccount]);

    const getPageTitle = useMemo(() => {
        if (!currentAccount) return 'EN Discover';
        
        const baseTitle = router.pathname === '/' ? 'Mood board' :
                         router.pathname === '/resources' ? 'Resources' :
                         router.pathname === '/friends' ? 'Friends' :
                         router.pathname === '/consultation' ? 'Consultation' : '';

        // Add tenant context if not in personal tenant
        if (baseTitle && currentTenantAssociation && 
            currentAccount.tenants.context.currentTenantId !== currentAccount.tenants.context.personalTenantId) {
            const tenantType = currentTenantAssociation.accountType.toLowerCase();
            return `${baseTitle} - ${tenantType}`;
        }

        return baseTitle;
    }, [router.pathname, currentAccount, currentTenantAssociation]);

    const handleThemeToggle = useCallback(() => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        toggleThemeMode();
        updateTheme(newMode);
    }, [mode, toggleThemeMode, updateTheme]);

    const handleOpenAccountDrawer = useCallback(() => {
        setIsAccountDrawerOpen(true);
    }, []);

    const handleCloseAccountDrawer = useCallback(() => {
        setIsAccountDrawerOpen(false);
    }, []);

    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleMessagingToggle = useCallback(() => {
        onMessagingToggle(true);
    }, [onMessagingToggle]);

    const handleSwitchTenant = useCallback((tenantId: string) => {
        onAccountChange(tenantId);
        handleMenuClose();
        handleCloseAccountDrawer();
    }, [onAccountChange]);

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {currentAccount ? (
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
                                    <>
                                        <IconButton
                                            onClick={handleMenuOpen}
                                            className="transition-all hover:scale-105"
                                        >
                                            <AvatarComponent
                                                user={{
                                                    avatarUrl: currentAccount.avatarUrl,
                                                    firstName: currentAccount.firstName,
                                                    lastName: currentAccount.lastName,
                                                }}
                                                size={40}
                                            />
                                        </IconButton>
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl)}
                                            onClose={handleMenuClose}
                                            PaperProps={{
                                                sx: {
                                                    bgcolor: 'background.paper',
                                                    borderRadius: 2,
                                                    boxShadow: theme.shadows[3],
                                                    minWidth: 280,
                                                },
                                            }}
                                        >
                                            <TenantSwitcher onAccountChange={handleSwitchTenant} />
                                        </Menu>
                                        <Box>
                                            <Typography variant="body1" color="textPrimary">
                                                {currentAccount.firstName} {currentAccount.lastName}
                                            </Typography>
                                            {currentTenantAssociation && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {currentTenantAssociation.role} • {currentTenantAssociation.accessLevel}
                                                </Typography>
                                            )}
                                        </Box>
                                    </>
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ThemeToggleIcon theme={mode} toggleTheme={handleThemeToggle} />
                        {currentAccount && !isMobile && (
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
                                    onClick={handleMessagingToggle}
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
                        {!currentAccount && !isMobile && (
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
            </AppBar>

            {/* Mobile drawer */}
            {isMobile && currentAccount && (
                <MuiSwipeableDrawer
                    anchor="bottom"
                    open={isAccountDrawerOpen}
                    onClose={handleCloseAccountDrawer}
                    onOpen={handleOpenAccountDrawer}
                    PaperProps={{
                        sx: {
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            bgcolor: 'background.paper',
                        },
                    }}
                >
                    <Box className="animate-fade-in p-4">
                        <TenantSwitcher onAccountChange={handleSwitchTenant} />
                    </Box>
                </MuiSwipeableDrawer>
            )}
        </>
    );
};

export default Header;