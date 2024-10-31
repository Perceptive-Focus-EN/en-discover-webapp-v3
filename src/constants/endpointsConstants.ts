export const API_ENDPOINTS = {
  // User endpoints
  GET_USER: '/api/users',
  GET_CURRENT_USER: '/api/auth/me',
  UPDATE_USER: '/api/users/update',
  DELETE_USER: '/api/users/delete',
  UPLOAD_AVATAR: '/api/users/upload-avatar',
  GET_USER_DASHBOARDS: '/api/users/${userId}/dashboards',
  CREATE_DASHBOARD: '/api/users/${userId}/dashboards',


  // Tenant endpoints
  GET_TENANTS: '/api/tenants',
  GET_TENANT: '/api/tenants/${tenantId}',
  CREATE_TENANT: '/api/tenants',
  UPDATE_TENANT: '/api/tenants/${tenantId}',
  DELETE_TENANT: '/api/tenants/${tenantId}',
  GET_TENANT_USERS: '/api/tenants/${tenantId}/users',
  // CREATE_TENANT_USER: '/api/tenants/${tenantId}/users',
  UPDATE_TENANT_USER: '/api/tenants/${tenantId}/users/${userId}',
  DELETE_TENANT_USER: '/api/tenants/${tenantId}/users/${userId}',
  GET_TENANT_DASHBOARDS: '/api/tenants/${tenantId}/dashboards',
  CREATE_TENANT_DASHBOARD: '/api/tenants/${tenantId}/dashboards',
  GET_TENANT_WIDGETS: '/api/tenants/${tenantId}/widgets',
  CREATE_TENANT_WIDGET: '/api/tenants/${tenantId}/widgets',
  GET_TENANT_WIDGET_TYPES: '/api/tenants/${tenantId}/widgets/types',

  // EN social media app
  
  SWITCH_TENANT: '/api/users/switch-tenant',
  JOIN_TENANT: '/api/users/join-tenant',
  GET_USER_TENANTS: '/api/users/get-user-tenants',

  SEND_CONNECTION_REQUEST: '/api/users/connections/request',
  ACCEPT_CONNECTION_REQUEST: '/api/users/connections/accept',
  GET_CONNECTIONS: '/api/users/connections',
  GET_CONNECTION_REQUESTS: '/api/users/connections/requests',



  // Widget endpoints
  GET_WIDGETS: '/api/dashboards/${dashboardId}/widgets',
  ADD_WIDGET: '/api/dashboards/${dashboardId}/widgets',
  UPDATE_WIDGET: '/api/widgets/${widgetId}',
  DELETE_WIDGET: '/api/widgets/${widgetId}',
  GET_WIDGET_PERMISSIONS: '/api/widgets/${widgetId}/permissions',
  SET_WIDGET_PERMISSIONS: '/api/widgets/${widgetId}/permissions',
  GET_WIDGET_DATA: '/api/widgets/${widgetId}/data',
  SUBSCRIBE_TO_WIDGET_UPDATES: '/api/widgets/${widgetId}/updates',

  DASHBOARDS: {
    INDEX: '/api/dashboards',
    DETAIL: (dashboardId: string) => `/api/dashboards/${dashboardId}`,
    GET_DASHBOARD: '/api/dashboards',
    UPDATE_DASHBOARD: (dashboardId: string) => `/api/dashboards/${dashboardId}`,
    DELETE_DASHBOARD: (dashboardId: string) => `/api/dashboards/${dashboardId}`,
    WIDGETS: (dashboardId: string) => `/api/dashboards/${dashboardId}/widgets`,
  },



  USERS: {
    DASHBOARDS: (userId: string) => `/api/users/${userId}/dashboards`,
  },

  WIDGETS: {
  BASE: '/api/widgets',
  ALL: '/api/widgets',
  BY_DASHBOARD: (dashboardId: string) => `/api/dashboards/${dashboardId}/widgets`,
  BY_ID: (dashboardId: string, widgetId: string) => `/api/dashboards/${dashboardId}/widgets/${widgetId}`,
  DATA: (dashboardId: string, widgetId: string) => `/api/dashboards/${dashboardId}/widgets/${widgetId}/data`,
  TYPES: '/api/widgets/types',
  DASHBOARD_PERMISSIONS: (dashboardId: string) => `/api/dashboards/${dashboardId}/permissions`,
},

  // Dashboard endpoints

  GET_DASHBOARD_PERMISSIONS: '/api/dashboard/${dashboardId}/permissions',
  SET_DASHBOARD_PERMISSIONS: '/api/dashboard/${dashboardId}/permissions',
  GET_DASHBOARD_DATA: '/api/dashboard/${dashboardId}/data',
  SUBSCRIBE_TO_DASHBOARD_UPDATES: '/api/dashboard/${dashboardId}/updates',

  // Dashboard data endpoints
  DASHBOARD_ANALYTICS: '/api/dashboard/analytics',
  DASHBOARD_GLOBAL_STATS: '/api/dashboard/global-stats',
  DASHBOARD_SYSTEM_HEALTH: '/api/dashboard/system-health',
  DASHBOARD_REGIONAL_DATA: '/api/dashboard/regional-data',
  DASHBOARD_GET_USER_STATS: '/api/dashboard/user-stats',


  DASHBOARD_DNS_RECORDS: '/api/dashboard/dns-records',
  DASHBOARD_CERTIFICATE_INFO: '/api/dashboard/certificate-info',
  DASHBOARD_REGENERATE_CERTIFICATE: '/api/dashboard/regenerate-certificate',
  DASHBOARD_QUEUE_STATUS: '/api/dashboard/queue-status',


  DASHBOARD_UPDATE_DOMAIN: '/api/dashboard/update-domain',

  DASHBOARD_USER_INFO: '/api/dashboard/user-info',
  DASHBOARD_TENANTS: '/api/dashboard/tenants',
  DASHBOARD_ONBOARDING_USERS: '/api/dashboard/onboarding-users',
  DASHBOARD_COMPLETE_ONBOARDING: '/api/dashboard/complete-onboarding',
  DASHBOARD_TENANT_INFO: '/api/dashboard/tenant-info',

  // Global stats endpoints
  GET_GLOBAL_STATS: '/api/global-stats',

  // Analytics endpoints
  GET_ANALYTICS_DATA: '/api/analytics',

  // Regional data endpoints
  GET_REGIONAL_DATA: '/api/regional-data',

  // System health endpoints
  GET_SYSTEM_HEALTH: '/api/system-health',

  // Authentication endpoints
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',


  // LOGIN: '/api/v1/app/auth/login',
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/v1/app/auth/signup',
  LOGOUT: '/api/v1/app/auth/logout',
  REQUEST_MAGIC_LINK: '/api/v1/app/auth/request-magic-link',
  VERIFY_MAGIC_LINK: '/api/v1/app/auth/verify-magic-link',
  // Add other endp

  
  USER_SIGNUP: '/api/auth/signup',
  USER_LOGIN: '/api/auth/login',
  // REQUEST_MAGIC_LINK: '/app/auth/request-magic-link',
  // VERIFY_MAGIC_LINK: '/app/auth/verify-magic-link',
  LOGOUT_USER: '/api/auth/logout',
  CREATE_TENANT_USER: '/api/tenant/user/create',

    // Token endpoints
  REVOKE_TOKENS: '/api/auth/revoke',
  REFRESH_TOKENS: '/api/auth/refresh',


  // Onboarding endpoints
  UPDATE_ONBOARDING_STEP: '/api/onboarding-steps',

  // Subscription endpoints
  VERIFY_SUBSCRIPTION: '/api/subscription/verify',
  CREATE_CHECKOUT_SESSION: '/api/stripe/create-checkout-session',
  GET_SUBSCRIPTION_STATUS: '/api/subscription/status',
  CREATE_SUBSCRIPTION: '/api/subscription/create',
  CANCEL_SUBSCRIPTION: '/api/subscription/cancel',
  UPDATE_SUBSCRIPTION: '/api/subscription/update',

  // Billing endpoints
  GET_BILLING_DATA: '/api/billing',

  // Payment endpoints
  CREATE_PAYMENT: '/api/payment',
  GET_PAYMENT: '/api/payment',

  // Invoice endpoints
  CREATE_INVOICE: '/api/stripe/invoice',
  GET_INVOICE: '/api/stripe/invoice',
  UPDATE_INVOICE: '/api/stripe/invoice/update',



  // Notificaitons for EN social media app
  // NOTIFICATIONS_UNREAD_COUNT: '/api/notifications/unread-count',
  // NOTIFICATIONS_FETCH: '/api/notifications/fetch',
  // NOTIFICATIONS_MARK_AS_READ: '/api/notifications/mark-as-read',
  // NOTIFICATIONS_MARK_ALL_AS_READ: '/api/notifications/mark-all-as-read',

  // Settings endpoints
  GET_SETTINGS: '/api/settings',
  UPDATE_SETTINGS: '/api/settings/update',

  // Feature flags endpoints
  GET_FEATURE_FLAGS: '/api/feature-flags',
  UPDATE_FEATURE_FLAGS: '/api/feature-flags/update',

  // Stripe customer endpoints
  GET_STRIPE_CUSTOMER: '/api/stripe/customer',
  CREATE_STRIPE_CUSTOMER: '/api/stripe/create-customer',

  // Resource endpoints
  GET_RESOURCE: '/api/resources',
  CREATE_RESOURCE: '/api/resources/create',
  UPDATE_RESOURCE: '/api/resources/update',
  DELETE_RESOURCE: '/api/resources/delete',

  LOGS: '/api/logs',
  METRICS: '/api/metrics',

  UPLOAD_PHOTO: '/api/upload/photo',
  UPLOAD_VIDEO: '/api/upload/video',
  UPLOAD_AUDIO: '/api/upload/audio',
  UPLOAD_FILE: '/api/upload/file',
  UPLOAD_DOCUMENT: '/api/upload/document',


    // Notification endpoints
  CREATE_NOTIFICATION: '/api/notifications/create',

  NOTIFICATIONS_FETCH: '/api/notifications/fetch',

  NOTIFICATIONS_UNREAD_COUNT: '/api/notifications/unread-count',

  NOTIFICATIONS_MARK_AS_READ: '/api/notifications/mark-as-read',

  NOTIFICATIONS_MARK_ALL_AS_READ: '/api/notifications/mark-all-as-read',

  NOTIFICATIONS_SUBSCRIBE: '/api/notifications/subscribe',

  NOTIFICATIONS_UNSUBSCRIBE: '/api/notifications/unsubscribe',


  NOTIFICATIONS_GET_SUBSCRIPTIONS: '/api/notifications/subscriptions',
  NOTIFICATIONS_GET_SUBSCRIBERS: '/api/notifications/subscribers',
  NOTIFICATIONS_GET_SUBSCRIBER: '/api/notifications/subscribers/${subscriberId}',
  NOTIFICATIONS_GET_SUBSCRIBER_NOTIFICATIONS: '/api/notifications/subscribers/${subscriberId}/notifications',
  NOTIFICATIONS_GET_SUBSCRIBER_NOTIFICATION: '/api/notifications/subscribers/${subscriberId}/notifications/${notificationId}',
} as const;
