// import { User } from '../types/user';
// import { rolePermissions, accessLevelPermissions, Permissions, defaultPermissions } from '../types/permissions';

// export function updateUserPermissions(user: User): User {
//   const roleBasedPermissions = rolePermissions[user.role] || {};
//   const accessLevelBasedPermissions = accessLevelPermissions[user.accessLevel] || {};

//   const updatedPermissions: Permissions = {
//     ...defaultPermissions,
//     ...roleBasedPermissions,
//     ...accessLevelBasedPermissions,
//     ...user.permissions,
//   };

//   return {
//     ...user,
//     permissions: updatedPermissions,
//   };
// }