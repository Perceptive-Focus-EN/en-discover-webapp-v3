// src/hocs/withPermissionCheck.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, UserWithPermissions } from '../../constants/AccessKey/permissionManager';
import { PERMISSIONS } from '../../constants/AccessKey/permissions';

interface WithPermissionCheckProps {
  requiredPermissions: (keyof typeof PERMISSIONS)[];
}

export function withPermissionCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { requiredPermissions }: WithPermissionCheckProps
) {
  return function WithPermissionCheck(props: P) {
    const { user } = useAuth();

    if (!user || !(user as UserWithPermissions).permissions) {
      // Handle unauthenticated user
      return <div>Please log in to access this feature.</div>;
    }

    const hasRequiredPermissions = requiredPermissions.every(permission =>
      hasPermission(user as UserWithPermissions, permission)
    );

    if (!hasRequiredPermissions) {
      // Handle insufficient permissions
      return <div>You don't have permission to access this feature.</div>;
    }

    return <WrappedComponent {...props} />;
  };
}