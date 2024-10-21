// import { User, Tenant } from '../types/user';
// import { SoftDeletable } from '../types/core';

// export function softDeleteUser(user: User & SoftDeletable, deletedBy: string): User {
//   user.softDelete = {
//     isDeleted: true,
//     deletedBy,
//     deletedAt: new Date().toISOString()
//   };
//   user.updatedAt = new Date().toISOString();
//   return user;
// }

// export function deactivateTenant(tenant: Tenant): Tenant {
//   tenant.isActive = false;
//   tenant.updatedAt = new Date().toISOString();
//   return tenant;
// }