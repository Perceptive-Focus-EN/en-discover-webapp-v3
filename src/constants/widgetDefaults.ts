// src/constants/widgetDefaults.ts
import { WidgetType, WidgetSize, WidgetPosition, WidgetPermissions, WidgetMarketplaceSettings, WidgetInstance, StandardWidgetType } from '@/types/Widgets';
// import { MarketplaceSettings } from '@/types/Dashboard';


export const DEFAULT_WIDGET_SIZE: WidgetSize = {
  width: 2,
  height: 2
};

export const DEFAULT_WIDGET_POSITION: WidgetPosition = {
  x: 0,
  y: 0
};

// WIll be provided byt the Dashbaord component whenever a widget is used. This will be prop than conditionally exist based on the dashboard use case.
export const DEFAULT_WIDGET_PERMISSIONS: WidgetPermissions = {
  roles: [],
  users: []
};

export const DEFAULT_WIDGET_MARKETPLACE_SETTINGS: WidgetMarketplaceSettings = {
  isCertified: false,
  rating: 0,
  salesCount: 0
};

export const DEFAULT_WIDGET_PROPS = {
  threshold: 80,
  color: 'blue',
  title: 'Widget Title',
  description: 'Widget Description',
  icon: 'StorageIcon',
  type: 'StorageWidget' as StandardWidgetType,
  settings: {},
  loading: false,
  error: null,
  lastUpdated: new Date().toISOString(),
  isPublic: false,
  isForSale: false,
};

export const DEFAULT_WIDGET: Omit<WidgetInstance, 'id' | 'userId' | 'tenantId'> = {
  name: 'New Widget',
  description: 'A new widget',
  type: 'StorageWidget',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  size: DEFAULT_WIDGET_SIZE,
  position: DEFAULT_WIDGET_POSITION,
  isDynamic: false,
  isResizable: true,
  defaultProps: DEFAULT_WIDGET_PROPS,
  configurableProps: [],
  permissions: DEFAULT_WIDGET_PERMISSIONS,
  tags: [],
  lastUpdated: new Date().toISOString(),
  isPublic: false,
  isForSale: false,
  marketplaceSettings: DEFAULT_WIDGET_MARKETPLACE_SETTINGS,
  createdBy: '',
};

export const WIDGET_TYPES: StandardWidgetType[] = [
  'DatabaseWidget',
  'StorageWidget',
  'FunctionWidget',
  'AnalyticsWidget',
  'UserStatsWidget',
  'SystemHealthWidget',
  'InsightsWidget'
];