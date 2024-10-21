// src/components/Settings/PermissionDrawer.tsx

import React, { useState, useEffect } from 'react';
import {
  SwipeableDrawer,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { UserAccountType, UserAccountTypeEnum } from '../../constants/AccessKey/accounts';
import { ACCESS_LEVELS, AccessLevel } from '../../constants/AccessKey/access_levels';
import { getPermissionsForAccountTypeAndLevel } from '../../constants/AccessKey/permissions/index';
import { InstituteRoles } from '../../constants/AccessKey/AccountRoles/instituteRoles';
import { useAuth } from '../../contexts/AuthContext';
import createAccessKey from '../../constants/AccessKey/AccessKeysComponent';
import { UnifiedAccessKeyParams } from '../../components/AccessKeyForms/types/UnifiedAccessKey';
import { Subscription_TypeEnum } from '../../constants/AccessKey/accounts';

interface PermissionDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  permissions: string[];
  onAddPermission: (permission: string) => void;
  onRemovePermission: (permission: string) => void;
}

const PermissionDrawer: React.FC<PermissionDrawerProps> = ({
  open,
  onClose,
  onOpen,
  permissions,
  onAddPermission,
  onRemovePermission,
}) => {
  const { user } = useAuth();
  const [newPermission, setNewPermission] = useState('');
  const [accountType, setAccountType] = useState<UserAccountType>(UserAccountTypeEnum.PERSONAL);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(AccessLevel.L0);
  const [instituteType, setInstituteType] = useState<keyof typeof InstituteRoles | ''>('');
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (accountType && accessLevel) {
      let perms: string[];
      if (accountType === UserAccountTypeEnum.INSTITUTE && instituteType) {
        perms = getPermissionsForAccountTypeAndLevel(accountType, accessLevel, instituteType as keyof typeof InstituteRoles).map(String);
      } else {
        perms = getPermissionsForAccountTypeAndLevel(accountType, accessLevel).map(String);
      }
      const currentPermissions = new Set(permissions);
      const additionalPerms = perms.filter(perm => !currentPermissions.has(perm));
      setAvailablePermissions(additionalPerms);
    }
  }, [accountType, accessLevel, instituteType, permissions]);

  const handleAddPermission = () => {
    if (newPermission.trim()) {
      onAddPermission(newPermission.trim());
      setNewPermission('');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAccessKeySubmit = async () => {
    try {
      const accessKeyParams: UnifiedAccessKeyParams = {
          ACCOUNT_TYPE: accountType,
          ACCESS_LEVEL: accessLevel,
          PERMISSIONS: permissions,
          USER_ID: '',
          ASSOCIATED_TENANT_ID: '',
          SYSTEM_LEVEL_ROLE: 'TENANT',
          ADDITIONAL_PERMISSIONS: [],
          SUBSCRIPTION_TYPE: Subscription_TypeEnum.TRIAL,
          TITLE: 'AlternativeEducation'
      };
      const createdAccessKey = await createAccessKey(accessKeyParams);
      setSuccessMessage('Access key and security badge created successfully!');
      console.log('Created Access Key:', createdAccessKey);
    } catch (error) {
      setErrorMessage('Failed to create access key and security badge. Please try again.');
      console.error('Error creating access key:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableSwipeToOpen={false}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Manage Permissions and Access Keys
        </Typography>
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Manage Permissions" />
          <Tab label="Create Access Key" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {/* Existing permission management UI */}
            {/* ... (keep the existing Grid items for account type, access level, etc.) */}
          </Grid>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="body1" paragraph>
              Create a new access key and security badge based on the current permissions.
            </Typography>
            <Button variant="contained" color="primary" onClick={handleAccessKeySubmit}>
              Create Access Key
            </Button>
          </Box>
        )}

        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {permissions.map((permission, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => onRemovePermission(permission)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={permission} />
            </ListItem>
          ))}
        </List>

        <Snackbar open={!!successMessage || !!errorMessage} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={successMessage ? "success" : "error"} sx={{ width: '100%' }}>
            {successMessage || errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </SwipeableDrawer>
  );
};

export default PermissionDrawer;