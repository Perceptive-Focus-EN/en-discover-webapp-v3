export const SOCIAL_PERMISSIONS = {
  FRIEND_REQUEST_SEND: 'FRIEND_REQUEST_SEND',
  FRIEND_REQUEST_ACCEPT: 'FRIEND_REQUEST_ACCEPT',
  FRIEND_REQUEST_REJECT: 'FRIEND_REQUEST_REJECT',
  FRIEND_REMOVE: 'FRIEND_REMOVE',
  PROFILE_VIEW: 'PROFILE_VIEW',
  PROFILE_EDIT: 'PROFILE_EDIT',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  PROFILE_DELETE: 'PROFILE_DELETE',

  MESSAGE_SEND: 'MESSAGE_SEND',
  POST_CREATE: 'POST_CREATE',
  POST_VIEW: 'POST_VIEW',
  POST_COMMENT: 'POST_COMMENT',
  POST_LIKE: 'POST_LIKE',
  CONNECTION_REQUEST_SEND: 'CONNECTION_REQUEST_SEND',
  CONNECTION_REQUEST_ACCEPT: 'CONNECTION_REQUEST_ACCEPT',
  CONNECTIONS_VIEW: 'CONNECTIONS_VIEW',
} as const;

export type SocialPermission = keyof typeof SOCIAL_PERMISSIONS;