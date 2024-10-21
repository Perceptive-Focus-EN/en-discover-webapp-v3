// src/components/AccountSwitcher.tsx

import React from 'react';
import { Box, Typography, Avatar, Button, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import SchoolIcon from '@mui/icons-material/School';
import { TenantInfo } from '@/types/Tenant/interfaces';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { useGlobalState } from '@/contexts/GlobalStateContext';

interface AccountSwitcherProps {
    tenants: (TenantInfo & { title: string })[];
    currentTenantId: string | null;
    onAccountChange: (tenantId: string) => void;
    onAddAccount: () => void;
}

const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ tenants, currentTenantId, onAccountChange, onAddAccount }) => {
    const {isLoading } = useGlobalState();
    const getTenantIcon = (type: string) => {
        switch (type) {
            case 'personal':
                return <PersonIcon />;
            case 'business':
                return <BusinessIcon />;
            case 'family':
                return <FamilyRestroomIcon />;
            case 'institution':
                return <SchoolIcon />;
            default:
                return <BusinessIcon />;
        }
    };

    if (isLoading) {
        return <div>Loading tenants...</div>;
        }

    return (
        <Box sx={{ p: 3, width: '100%', maxWidth: 400, margin: '0 auto' }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Switch Tenants
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {tenants.map((tenant) => (
                    <Button
                        key={tenant.tenantId}
                        onClick={() => onAccountChange(tenant.tenantId)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            p: 2,
                            borderRadius: 4,
                            bgcolor: currentTenantId === tenant.tenantId ? 'action.selected' : 'background.paper',
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                    >
                        <Avatar sx={{ mr: 2 }}>
                            {getTenantIcon(tenant.type)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">{tenant.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {tenant.type.charAt(0).toUpperCase() + tenant.type.slice(1)}
                            </Typography>
                        </Box>
                        <Chip label={tenant.title} size="small" />
                        {tenant.type === UserAccountTypeEnum.PERSONAL && (
                            <Chip label="Personal" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                    </Button>
                ))}
                <Button
                    onClick={onAddAccount}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    sx={{ borderRadius: 4, p: 2 }}
                >
                    Join New Tenant
                </Button>
            </Box>
        </Box>
    );
};

export default AccountSwitcher;