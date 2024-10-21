import { MarketplaceSettings } from './Dashboard';

// Widget Type
export type WidgetType = string;

export const STANDARD_WIDGET_TYPES = [
  'DatabaseWidget',
  'StorageWidget',
  'FunctionWidget',
  'AnalyticsWidget',
  'UserStatsWidget',
  'SystemHealthWidget',
  'InsightsWidget'
] as const;

export type StandardWidgetType = typeof STANDARD_WIDGET_TYPES[number];
export type CustomWidgetType = `Custom${string}Widget`;
export type AllWidgetTypes = StandardWidgetType | CustomWidgetType;

export interface WidgetProps {
  [key: string]: any;  // Flexible key-value pairs for dynamic widget props
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetPermissions {
  roles: string[];
  users: {
    userId: string;
    canConfigure: boolean; //This would be something like writing access
    canView: boolean; // This would be like reading access
  }[];
}

export interface WidgetMarketplaceSettings {
  isCertified: boolean;
  rating: number;
  salesCount: number;
}

export interface BaseWidgetProps {
  id: string;
  userId: string;
  tenantId: string;
  type: AllWidgetTypes;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  size: WidgetSize;
  position: WidgetPosition;
  isDynamic: boolean;
  isResizable: boolean;
  defaultProps: Record<string, any>;
  configurableProps: string[];
  permissions: WidgetPermissions;
  props?: any; // Add this line to include props in WidgetInstance
  tags: string[];
  lastUpdated: string;
  isCollapsed?: boolean;
  isPublic: boolean;
  isForSale: boolean;
  price?: number;
  marketplaceSettings?: WidgetMarketplaceSettings;
}

export type WidgetInstance = BaseWidgetProps;

export type CreateWidgetPayload = Omit<WidgetInstance, 'id' | 'createdAt' | 'updatedAt'>;

export interface WidgetContextType {
  onRemove?: (id: string) => void;
  onEdit?: (widget: WidgetInstance) => void;
  onConfigChange: (id: string, updates: Partial<WidgetInstance>) => void;
  onRefresh?: () => void;
  onResize?: (id: string, newSize: WidgetSize) => void;
  onMove?: (id: string, newPosition: WidgetPosition) => void;
}