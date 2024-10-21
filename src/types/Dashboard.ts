// src/types/Dashboard.ts
import { LayoutParams, ThemeConfig } from "./Shared/interfaces";

export interface Permissions {
  roles: string[];
  users: {
    userId: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
}

export interface MarketplaceSettings {
  isCertified: boolean;
  rating: number;
  salesCount: number;
}

export interface DashboardConfig {
  _id: string;
  userId: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  isPublic: boolean;
  isForSale: boolean;
  price?: number;
  layout: LayoutParams;
  widgetIds: string[]; // Array of widget IDs instead of full widget instances
  permissions: Permissions;
  marketplaceSettings?: MarketplaceSettings;
  // Remove widgets from here, as they will be managed separately
}

export interface DashboardContextType {
  dashboardConfigs: DashboardConfig[];
  currentDashboard: DashboardConfig | null;
  setCurrentDashboard: (dashboardId: string) => Promise<void>;
  createNewDashboard: (dashboardData: Partial<DashboardConfig>) => Promise<string>;
  updateDashboard: (dashboardId: string, updates: Partial<DashboardConfig>) => Promise<DashboardConfig>;
  deleteDashboard: (dashboardId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  isCustomizing: boolean;
  setIsCustomizing: React.Dispatch<React.SetStateAction<boolean>>;
  fetchDashboardData: () => Promise<void>;
}




// Marketplace settings for Widgets and Dashboards
export interface MarketplaceSettings {
  isCertified: boolean;
  rating: number;
  salesCount: number;
}

export interface GridConfig {
  columnCount: number;
  rowHeight: number;
  gutterSize: number;
  breakpoints: Record<string, { columnCount: number; rowHeight: number }>;
  responsive: boolean;
  maxColumns: number;
  snapToGrid: boolean;
  draggable: boolean;
  resizable: boolean;
  autoResize: boolean;
  rowResizeTolerance: number;
  padding: [number, number];
  animationSpeed: number;
}
