





// export type Permission =
//   | 'CREATE_USER'
//   | 'READ_USER'
//   | 'UPDATE_USER'
//   | 'DELETE_USER'
//   | 'CREATE_TENANT'
//   | 'READ_TENANT'
//   | 'UPDATE_TENANT'
//   | 'DELETE_TENANT'
//   | 'VIEW_ANALYTICS'
//   | 'MANAGE_SETTINGS'
//   | 'CHANGE_USER_ROLE'
//   | 'CHANGE_USER_ACCESS_LEVEL';

// export type Permissions = Record<Permission, boolean>;

// export const defaultPermissions: Permissions = {
//   CREATE_USER: false,
//   READ_USER: false,
//   UPDATE_USER: false,
//   DELETE_USER: false,
//   CREATE_TENANT: false,
//   READ_TENANT: false,
//   UPDATE_TENANT: false,
//   DELETE_TENANT: false,
//   VIEW_ANALYTICS: false,
//   MANAGE_SETTINGS: false,
//   CHANGE_USER_ROLE: false,
//   CHANGE_USER_ACCESS_LEVEL: false,
// };

// export type ResourcePermission =
//   | 'CREATE_BLOB_CONTAINER'
//   | 'DELETE_BLOB_CONTAINER'
//   | 'LIST_BLOB_CONTAINERS'
//   | 'LIST_BLOBS'
//   | 'UPLOAD_BLOB'
//   | 'CREATE_COLLECTION'
//   | 'CREATE_DATABASE'
//   | 'CREATE_DOCUMENT'
//   | 'DELETE_DATABASE'
//   | 'LIST_DATABASES'
//   | 'CREATE_FUNCTION'
//   | 'LIST_FUNCTIONS'
//   | 'CREATE_STORAGE_ACCOUNT'
//   | 'LIST_STORAGE_ACCOUNTS';

// export type ResourcePermissions = Record<ResourcePermission, boolean>;

// export const defaultResourcePermissions: ResourcePermissions = {
//   CREATE_BLOB_CONTAINER: false,
//   DELETE_BLOB_CONTAINER: false,
//   LIST_BLOB_CONTAINERS: false,
//   LIST_BLOBS: false,
//   UPLOAD_BLOB: false,
//   CREATE_COLLECTION: false,
//   CREATE_DATABASE: false,
//   CREATE_DOCUMENT: false,
//   DELETE_DATABASE: false,
//   LIST_DATABASES: false,
//   CREATE_FUNCTION: false,
//   LIST_FUNCTIONS: false,
//   CREATE_STORAGE_ACCOUNT: false,
//   LIST_STORAGE_ACCOUNTS: false,
// };

// type CombinedPermissions = Permissions & ResourcePermissions;

// export const rolePermissions: Record<UserRole, Partial<CombinedPermissions>> = {
//     Owner: {
//         CREATE_USER: true,
//         READ_USER: true,
//         UPDATE_USER: true,
//         DELETE_USER: true,
//         CREATE_TENANT: true,
//         READ_TENANT: true,
//         UPDATE_TENANT: true,
//         DELETE_TENANT: true,
//         VIEW_ANALYTICS: true,
//         MANAGE_SETTINGS: false,
//         CHANGE_USER_ROLE: false,
//         CHANGE_USER_ACCESS_LEVEL: false,
//         CREATE_BLOB_CONTAINER: true,
//         DELETE_BLOB_CONTAINER: true,
//         LIST_BLOB_CONTAINERS: true,
//         LIST_BLOBS: true,
//         UPLOAD_BLOB: true,
//         CREATE_COLLECTION: true,
//         CREATE_DATABASE: true,
//         CREATE_DOCUMENT: true,
//         DELETE_DATABASE: true,
//         LIST_DATABASES: true,
//         CREATE_FUNCTION: true,
//         LIST_FUNCTIONS: true,
//         CREATE_STORAGE_ACCOUNT: true,
//         LIST_STORAGE_ACCOUNTS: true
//     },
//     CEO: {},
//     CFO: {},
//     Manager: {},
//     Employee: {},
//     Other: {},
// };

// export const accessLevelPermissions: Record<AccessLevel, Partial<CombinedPermissions>> = {
//     ADMIN: {
//         CREATE_USER: true,
//         READ_USER: true,
//         UPDATE_USER: true,
//         DELETE_USER: true,
//         CREATE_TENANT: true,
//         READ_TENANT: true,
//         UPDATE_TENANT: true,
//         DELETE_TENANT: true,
//         VIEW_ANALYTICS: true,
//         MANAGE_SETTINGS: true,
//         CHANGE_USER_ROLE: true,
//         CHANGE_USER_ACCESS_LEVEL: true,
//         CREATE_BLOB_CONTAINER: true,
//         DELETE_BLOB_CONTAINER: true,
//         LIST_BLOB_CONTAINERS: true,
//         LIST_BLOBS: true,
//         UPLOAD_BLOB: true,
//         CREATE_COLLECTION: true,
//         CREATE_DATABASE: true,
//         CREATE_DOCUMENT: true,
//         DELETE_DATABASE: true,
//         LIST_DATABASES: true,
//         CREATE_FUNCTION: true,
//         LIST_FUNCTIONS: true,
//         CREATE_STORAGE_ACCOUNT: true,
//         LIST_STORAGE_ACCOUNTS: true
//     },
//     USER: {
//         READ_USER: true,
//         UPDATE_USER: false,
//         DELETE_USER: false,
//         CREATE_TENANT: false,
//         READ_TENANT: true,
//         UPDATE_TENANT: false,
//         DELETE_TENANT: false,
//         VIEW_ANALYTICS: true,
//     },
//     TEMPORARY: {
//         READ_USER: true,
//         READ_TENANT: true,
//         VIEW_ANALYTICS: true,
//         CREATE_BLOB_CONTAINER: false,
//         DELETE_BLOB_CONTAINER: false,
//         LIST_BLOB_CONTAINERS: false,
//         LIST_BLOBS: false,
//         UPLOAD_BLOB: false,
//         CREATE_COLLECTION: false,
//         CREATE_DATABASE: false,
//         CREATE_DOCUMENT: false,
//         DELETE_DATABASE: false,
//         LIST_DATABASES: false,
//         CREATE_FUNCTION: false,
//         LIST_FUNCTIONS: false,
//         CREATE_STORAGE_ACCOUNT: false,
//     },
// };