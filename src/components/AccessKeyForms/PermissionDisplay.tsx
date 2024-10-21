// src/components/AccessKeyForms/PermissionDisplay.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
  alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getPermissionsForAccountTypeAndLevel, AccessLevelPermissions } from '../../constants/AccessKey/permissions/index';
import { UserAccountType } from '../../constants/AccessKey/accounts';
import { AccessLevel } from '../../constants/AccessKey/access_levels';
import { InstituteRoles } from '@/constants/AccessKey/AccountRoles/instituteRoles';

interface PermissionDisplayProps {
  accountType: UserAccountType;
  accessLevel: AccessLevel;
  additionalPermissions: string[];
  instituteType?: keyof typeof InstituteRoles;
}

const PermissionDisplay: React.FC<PermissionDisplayProps> = ({ 
  accountType, 
  accessLevel, 
  additionalPermissions = [],
  instituteType
}) => {
  const [expanded, setExpanded] = useState(false);
  const [displayPermissions, setDisplayPermissions] = useState<string[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    let basePermissions: string[];
    if (accountType === 'INSTITUTE' && instituteType) {
      basePermissions = AccessLevelPermissions.INSTITUTE[instituteType][accessLevel] as string[];
    } else {
      basePermissions = (getPermissionsForAccountTypeAndLevel(accountType, accessLevel) || []).map(permission => typeof permission === 'string' ? permission : JSON.stringify(permission));
    }
    
    if (accessLevel !== AccessLevel.L4) {
      setDisplayPermissions(parsePermissionsForDisplay([...basePermissions, ...additionalPermissions.filter(permission => typeof permission === 'string')]));
    } else {
      setDisplayPermissions(parsePermissionsForDisplay(basePermissions));
    }
  }, [accountType, accessLevel, additionalPermissions, instituteType]);

  const parsePermissionsForDisplay = (permissions: string[]): string[] => {
    return permissions.map(permission => permission.trim());
  };

  const getAccessLevelColor = (level: AccessLevel) => {
    switch (level) {
      case AccessLevel.L0:
        return theme.palette.error.light;
      case AccessLevel.L1:
        return theme.palette.warning.light;
      case AccessLevel.L2:
        return theme.palette.info.light;
      case AccessLevel.L3:
        return theme.palette.success.light;
      case AccessLevel.L4:
        return theme.palette.primary.light;
      default:
        return theme.palette.grey[300];
    }
  };

  const getAdditionalPermissionColor = () => {
    return theme.palette.mode === 'dark' ? '#9c27b0' : '#7b1fa2'; // Purple color
  };

  if (!displayPermissions.length) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(getAccessLevelColor(accessLevel), 0.5)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: `0 0 0 2px ${alpha(getAccessLevelColor(accessLevel), 0.2)}`,
        },
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        sx={{
          bgcolor: alpha(getAccessLevelColor(accessLevel), 0.1),
          borderBottom: expanded
            ? `1px solid ${alpha(getAccessLevelColor(accessLevel), 0.2)}`
            : 'none',
        }}
      >
        <Box
          display="flex"
          flexDirection={isMobile ? 'column' : 'row'}
          alignItems={isMobile ? 'flex-start' : 'center'}
        >
          <Chip
            label={`${accountType}${instituteType ? ` - ${instituteType}` : ''} - Level ${accessLevel.slice(-1)}`}
            sx={{
              bgcolor: alpha(getAccessLevelColor(accessLevel), 0.2),
              color: theme.palette.getContrastText(getAccessLevelColor(accessLevel)),
              fontWeight: 'bold',
              mr: isMobile ? 0 : 2,
              mb: isMobile ? 1 : 0,
            }}
          />
          <Typography variant="subtitle1" color="text.secondary">
            {displayPermissions.length} Permission{displayPermissions.length !== 1 ? 's' : ''}
            {accessLevel !== AccessLevel.L4 && additionalPermissions.length > 0 && (
              <span> (including {additionalPermissions.length} additional)</span>
            )}
          </Typography>
        </Box>
        <IconButton
          onClick={() => setExpanded(!expanded)}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box
          display="flex"
          flexWrap="wrap"
          gap={1}
          p={2}
          sx={{
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${alpha(getAccessLevelColor(accessLevel), 0.2)}`,
          }}
        >
          {displayPermissions.map((permission, index) => (
            <Chip
              key={index}
              label={String(permission)}
              size="small"
              sx={{
                bgcolor: additionalPermissions.includes(permission)
                  ? alpha(getAdditionalPermissionColor(), theme.palette.mode === 'dark' ? 0.2 : 0.1)
                  : alpha(getAccessLevelColor(accessLevel), 0.05),
                color: additionalPermissions.includes(permission)
                  ? getAdditionalPermissionColor()
                  : theme.palette.text.primary,
                '&:hover': {
                  bgcolor: additionalPermissions.includes(permission)
                    ? alpha(getAdditionalPermissionColor(), theme.palette.mode === 'dark' ? 0.3 : 0.2)
                    : alpha(getAccessLevelColor(accessLevel), 0.1),
                },
              }}
            />
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default PermissionDisplay;