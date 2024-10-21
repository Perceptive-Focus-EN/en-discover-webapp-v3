import React, { useState, useEffect } from 'react';
import {
  TextField, Button, MenuItem, Typography, InputAdornment, Tooltip, alpha, Box, useMediaQuery
} from '@mui/material';
import { ACCOUNT_TYPES, Subscription_Type, UserAccountType } from '../../constants/AccessKey/accounts';
import { ROLES, AllRoles } from '../../constants/AccessKey/AccountRoles/index';
import { ACCESS_LEVELS, AccessLevel } from '../../constants/AccessKey/access_levels';
import { createUnifiedAccessKey } from './UnifiedAccessKey';
import { UnifiedAccessKeyParams } from './types/UnifiedAccessKey';
import { SYSTEM_LEVEL_ROLES } from '../../constants/AccessKey/AccountRoles/system-level-roles';
import LockIcon from '@mui/icons-material/Lock';
import {
  InstituteTypes,
  InstituteRoles,
  getBaseTypeForInstituteType,
} from '../../constants/AccessKey/AccountRoles/institutes-roles';
import PermissionDisplay from './PermissionDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import SecurityBadgePreview from './SecurityBadgePreview';
import { AccessLevelPermissions } from '../../constants/AccessKey/permissions/index';

interface UnifiedAccessKeyFormProps {
  onSubmit: (accessKey: UnifiedAccessKeyParams & { badgeData: any }) => void;
  onChange: (accountType: UserAccountType, accessLevel: AccessLevel) => void;
  selectedAccountType: string;
}

const UnifiedAccessKeyForm: React.FC<UnifiedAccessKeyFormProps> = ({
  onSubmit,
  onChange,
  selectedAccountType,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [accountType, setAccountType] = useState<keyof typeof ACCOUNT_TYPES | ''>(
    (selectedAccountType as keyof typeof ACCOUNT_TYPES) || ''
  );
  const [title, setTitle] = useState<AllRoles | ''>('');
  const [systemRole, setSystemRole] = useState<keyof typeof SYSTEM_LEVEL_ROLES>('USER');
  const [baseInstituteType, setBaseInstituteType] = useState('');
  const [instituteType, setInstituteType] = useState<keyof typeof InstituteRoles | ''>('');
  const [additionalPermissions, setAdditionalPermissions] = useState<string[]>([]);
  const [availableAdditionalPermissions, setAvailableAdditionalPermissions] = useState<string[]>([]);
  const [email, setEmail] = useState<string>('');
  const [formData, setFormData] = useState<{
    USER_ID: string;
    ASSOCIATED_TENANT_ID: string;
    SUBSCRIPTION_TYPE: Subscription_Type;
    SYSTEM_LEVEL_ROLE: keyof typeof SYSTEM_LEVEL_ROLES;
    ACCESS_LEVEL: AccessLevel;
  }>({
    USER_ID: user?.userId || '',
    ASSOCIATED_TENANT_ID: user?.currentTenantId || '',
    SUBSCRIPTION_TYPE: 'TRIAL' as Subscription_Type,
    SYSTEM_LEVEL_ROLE: SYSTEM_LEVEL_ROLES.USER,
    ACCESS_LEVEL: AccessLevel.L4 as AccessLevel,
  });

  const [badgeData, setBadgeData] = useState({
    name: '',
    role: '',
    accessLevel: '',
    accountType: '',
    avatarUrl: '',
    accessKey: '',
    nfcId: '',
  });

  // Reset additionalPermissions when accountType or accessLevel changes
  useEffect(() => {
    if (accountType && formData.ACCESS_LEVEL) {
      // Trigger onChange event with updated accountType and accessLevel
      onChange(accountType as UserAccountType, formData.ACCESS_LEVEL as AccessLevel);

      let allL4Permissions: string[] = [];
      let currentLevelPermissions: string[] = [];

      // Check if account type is 'INSTITUTE' and instituteType is selected
      if (accountType === ACCOUNT_TYPES.INSTITUTE && instituteType) {
        // Get L4 permissions for the selected institute type
        allL4Permissions = AccessLevelPermissions.INSTITUTE[instituteType][AccessLevel.L4] as string[];
        // Get current level permissions for the selected institute type and access level
        currentLevelPermissions = AccessLevelPermissions.INSTITUTE[instituteType][formData.ACCESS_LEVEL as AccessLevel] as string[];
      } else if (accountType in AccessLevelPermissions) {
        // Handle non-institute account types
        const validAccountType = accountType as keyof typeof AccessLevelPermissions;
        allL4Permissions = AccessLevelPermissions[validAccountType][AccessLevel.L4 as keyof typeof AccessLevelPermissions[typeof validAccountType]] as string[];
        currentLevelPermissions = AccessLevelPermissions[validAccountType][formData.ACCESS_LEVEL as keyof typeof AccessLevelPermissions[typeof validAccountType]] as string[];
      } else {
        // Handle invalid account types
        console.warn(`Invalid account type: ${accountType}`);
        allL4Permissions = [];
        currentLevelPermissions = [];
      }

      // Filter permissions that exist in L4 but not in the current level to be additional permissions
      const additionalPerms = allL4Permissions?.filter((perm: string) => !currentLevelPermissions?.includes(perm)) || [];
      setAvailableAdditionalPermissions(additionalPerms);
    }
  }, [accountType, formData.ACCESS_LEVEL, onChange, instituteType]);

  const handleInstituteTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newInstituteType = event.target.value as keyof typeof InstituteRoles;
    setInstituteType(newInstituteType);
    setFormData((prevData) => ({
      ...prevData,
      INSTITUTE_TYPE: newInstituteType,
    }));
    setTitle(''); // Reset title when institute type changes
  };

  useEffect(() => {
    const updatedFormData = {
      ...formData,
      TITLE: title,
      ACCOUNT_TYPE: accountType,
      ADDITIONAL_PERMISSIONS: additionalPermissions,
      PERMISSIONS: [], // Add the PERMISSIONS property here
    };

    const accessKeyResponse = createUnifiedAccessKey(updatedFormData as UnifiedAccessKeyParams);
    const newAccessKey = accessKeyResponse.ACCESS_KEY || '';
    const newNfcId = accessKeyResponse.NFC_ID || '';

    setBadgeData({
      name: `${user?.firstName} ${user?.lastName}`,
      role: title as string,
      accessLevel: formData.ACCESS_LEVEL as string,
      accountType: accountType as string,
      avatarUrl: user?.avatarUrl || '',
      accessKey: newAccessKey,
      nfcId: newNfcId,
    });
  }, [user, title, formData, accountType, additionalPermissions]);

  const handleAccountTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setAccountType(event.target.value as keyof typeof ACCOUNT_TYPES);
    setTitle('');
    setInstituteType('');
    setBaseInstituteType('');
    setAdditionalPermissions([]);
    setAvailableAdditionalPermissions([]);
  };

  const handleTitleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newTitle = event.target.value as AllRoles;
    setTitle(newTitle);
    setFormData((prevData) => ({ ...prevData, TITLE: newTitle }));
  };

  const handleSystemRoleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSystemRole(event.target.value as keyof typeof SYSTEM_LEVEL_ROLES);
    setFormData((prevData) => ({
      ...prevData,
      SYSTEM_LEVEL_ROLE: event.target.value as keyof typeof SYSTEM_LEVEL_ROLES,
    }));
  };

  const handleBaseInstituteTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newBaseInstituteType = event.target.value as string;
    setBaseInstituteType(newBaseInstituteType);
    setFormData((prevData) => ({
      ...prevData,
      BASE_INSTITUTE_TYPE: newBaseInstituteType,
    }));
  };

  const handleAccessLevelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFormData((prevData) => ({
      ...prevData,
      ACCESS_LEVEL: event.target.value as AccessLevel,
    }));
  };

  const handleAdditionalPermissionsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setAdditionalPermissions(event.target.value as string[]);
  };

  const handleEmailChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setEmail(event.target.value as string);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (accountType && title && (accountType !== ACCOUNT_TYPES.INSTITUTE || instituteType)) {
      const updatedFormData: UnifiedAccessKeyParams = {
        ...formData,
        TITLE: title,
        ADDITIONAL_PERMISSIONS: additionalPermissions,
        ACCOUNT_TYPE: accountType,
        INSTITUTE_TYPE: accountType === ACCOUNT_TYPES.INSTITUTE && instituteType ? instituteType as InstituteTypes : undefined,
        PERMISSIONS: [], // Ensure PERMISSIONS is included
      };
      const accessKey = createUnifiedAccessKey(updatedFormData);
      onSubmit({ ...accessKey, badgeData, email });
    }
  };

  const getROLESForAccountType = () => {
    if (accountType === ACCOUNT_TYPES.INSTITUTE && instituteType) {
      return InstituteRoles[instituteType];
    }
    switch (accountType) {
      case ACCOUNT_TYPES.PERSONAL: return ROLES.Personal;
      case ACCOUNT_TYPES.FAMILY: return ROLES.Family;
      case ACCOUNT_TYPES.BUSINESS: return ROLES.Business;
      case ACCOUNT_TYPES.FINANCIAL: return ROLES.Finance;
      case ACCOUNT_TYPES.HEALTH_CARE: return ROLES.HealthCare;
      case ACCOUNT_TYPES.NON_PROFIT: return ROLES.NonProfit;
      default: return {};
    }
  };

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
      <Box flex={1}>
        <form onSubmit={handleSubmit}>
          <TextField
            select
            required
            label="Account Type"
            value={accountType}
            onChange={handleAccountTypeChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            {Object.entries(ACCOUNT_TYPES).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            label="System Role"
            value={systemRole}
            onChange={handleSystemRoleChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            {Object.entries(SYSTEM_LEVEL_ROLES).map(([key, value]) => (
              <MenuItem key={key} value={value as string | number | readonly string[] | undefined}>
                {key}
              </MenuItem>
            ))}
          </TextField>

          {accountType === ACCOUNT_TYPES.INSTITUTE && (
            <>
              <TextField
                select
                required
                label="Institute Type"
                value={instituteType}
                onChange={handleInstituteTypeChange}
                fullWidth
                sx={{ mb: 2 }}
              >
                {Object.keys(InstituteRoles).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>

              {instituteType && (
                <TextField
                  select
                  required
                  label="Institute Role"
                  value={title}
                  onChange={handleTitleChange}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {Object.entries(InstituteRoles[instituteType]).map(([key, value]) => (
                    <MenuItem key={key} value={value as string | number | readonly string[] | undefined}>
                      {key}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </>
          )}

          {accountType && accountType !== ACCOUNT_TYPES.INSTITUTE && (
            <TextField
              select
              required
              label="Title"
              value={title}
              onChange={handleTitleChange}
              fullWidth
              sx={{ mb: 2 }}
            >
              {Object.entries(getROLESForAccountType()).map(([key, value]) => (
                <MenuItem key={key} value={value as string | number | readonly string[] | undefined}>
                  {key}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            required
            name="USER_ID"
            label="User ID"
            value={formData.USER_ID}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            fullWidth
            sx={{
              mb: 2,
              '& .MuiInputBase-input': {
                color: alpha(theme.palette.text.primary, 0.7),
                bgcolor: alpha(theme.palette.action.disabledBackground, 0.1),
                fontStyle: 'italic',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: alpha(theme.palette.action.disabled, 0.5),
                },
              },
            }}
          />

          <TextField
            required
            name="ASSOCIATED_TENANT_ID"
            label="Tenant ID"
            value={formData.ASSOCIATED_TENANT_ID}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            fullWidth
            sx={{
              mb: 2,
              '& .MuiInputBase-input': {
                color: alpha(theme.palette.text.primary, 0.7),
                bgcolor: alpha(theme.palette.action.disabledBackground, 0.1),
                fontStyle: 'italic',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: alpha(theme.palette.action.disabled, 0.5),
                },
              },
            }}
          />

          <TextField
            select
            required
            name="SUBSCRIPTION_TYPE"
            label="Subscription Type"
            value={formData.SUBSCRIPTION_TYPE}
            onChange={(e) => setFormData((prevData) => ({ ...prevData, SUBSCRIPTION_TYPE: e.target.value as Subscription_Type }))}
            fullWidth
            sx={{ mb: 2 }}
          >
            {(['TRIAL', 'PAID', 'DISCOUNTED', 'BETA', 'UNLOCKED'] as Subscription_Type[]).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            name="ACCESS_LEVEL"
            label="Access Level"
            value={formData.ACCESS_LEVEL}
            onChange={handleAccessLevelChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            {Object.entries(ACCESS_LEVELS).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {key}
              </MenuItem>
            ))}
          </TextField>

          {formData.ACCESS_LEVEL !== AccessLevel.L4 && availableAdditionalPermissions.length > 0 && (
            <Tooltip title="Additional Permissions allow you to grant specific access beyond the current level" placement="top">
              <TextField
                select
                multiline
                name="additionalPermissions"
                label={`Additional Permissions (${additionalPermissions.length})`}
                value={additionalPermissions}
                onChange={handleAdditionalPermissionsChange}
                fullWidth
                sx={{ mb: 2 }}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => (selected as string[]).join(', '),
                }}
              >
                {availableAdditionalPermissions.map((permission) => (
                  <MenuItem key={permission} value={permission}>
                    {permission}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>
          )}

          <TextField
            required
            name="email"
            label="User Email"
            value={email}
            onChange={handleEmailChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          {accountType && formData.ACCESS_LEVEL && (
            <PermissionDisplay
              accountType={accountType as UserAccountType}
              accessLevel={formData.ACCESS_LEVEL as AccessLevel}
              additionalPermissions={additionalPermissions}
              instituteType={instituteType as keyof typeof InstituteRoles}
            />
          )}

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Create Access Key and Security Badge
          </Button>
        </form>
      </Box>

      {isMobile && (
        <Box flex={1} display={{ xs: 'block', md: 'none' }}>
          <Typography variant="h6" gutterBottom>
            Security Badge Preview
          </Typography>
          {badgeData.name && (
            <SecurityBadgePreview
              name={badgeData.name}
              role={badgeData.role}
              accessLevel={badgeData.accessLevel}
              accountType={badgeData.accountType}
              avatarUrl={badgeData.avatarUrl}
              userId={formData.USER_ID || ''}
              tenantId={formData.ASSOCIATED_TENANT_ID || ''}
              accessKey={badgeData.accessKey}
              nfcId={badgeData.nfcId}
            />
          )}
        </Box>
      )}

      {!isMobile && (
        <Box flex={1} display={{ xs: 'none', md: 'block' }}>
          <Typography variant="h6" gutterBottom>
            Security Badge Preview
          </Typography>
          {badgeData.name && (
            <SecurityBadgePreview
              name={badgeData.name}
              role={badgeData.role}
              accessLevel={badgeData.accessLevel}
              accountType={badgeData.accountType}
              avatarUrl={badgeData.avatarUrl}
              userId={formData.USER_ID || ''}
              tenantId={formData.ASSOCIATED_TENANT_ID || ''}
              accessKey={badgeData.accessKey}
              nfcId={badgeData.nfcId}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default UnifiedAccessKeyForm;
