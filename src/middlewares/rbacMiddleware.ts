// src/middlewares/rbacMiddleware.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { UserWithPermissions, hasPermission, hasAllPermissions } from '@/constants/AccessKey/permissionManager';
import { PERMISSIONS } from '@/constants/AccessKey/permissions';
import { getUserTemplate, UserTemplateKey } from '@/constants/userTemplates';
import { getAzureUserTemplate, AzureUserTemplateKey, AZURE_USER_TEMPLATES } from '@/constants/azureUserTemplates';

type NextApiHandlerWithRBAC = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: UserWithPermissions
) => Promise<void> | void;

type RequiredPermissions = (keyof typeof PERMISSIONS)[] | UserTemplateKey | AzureUserTemplateKey;

export function rbacMiddleware(requiredPermissions: RequiredPermissions) {
  return (handler: NextApiHandlerWithRBAC) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const user = (req as any).user as UserWithPermissions;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      }

      let permissionsToCheck: (keyof typeof PERMISSIONS)[];

      if (typeof requiredPermissions === 'string') {
        if (requiredPermissions in AZURE_USER_TEMPLATES) {
          const template = getAzureUserTemplate(requiredPermissions as AzureUserTemplateKey);
          permissionsToCheck = template.additionalPermissions as (keyof typeof PERMISSIONS)[];
        } else {
          const template = getUserTemplate(requiredPermissions as UserTemplateKey);
          permissionsToCheck = template.additionalPermissions as (keyof typeof PERMISSIONS)[];
        }
      } else {
        permissionsToCheck = requiredPermissions;
      }

      const hasRequiredPermissions = hasAllPermissions(user, permissionsToCheck);

      if (!hasRequiredPermissions) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      return handler(req, res, user);
    };
  };
}

export default rbacMiddleware;