
// Layout types and interfaces for the dashboard layout configuration (you can extend this as necessary)

import { FontFamily, PrimaryColor } from "./types";

export interface BackgroundImage {
    file: string;
    url: string;
    alt: string;
}

export interface ThemeConfig {
    primaryColor: PrimaryColor;
    fontFamily: FontFamily;
    backgroundImage?: BackgroundImage;
};

export interface LayoutType {
  type: 'grid' | 'freeform' | 'masonry';
  config: LayoutConfig;
  theme: ThemeConfig;
}

export interface LayoutConfig {
  columnCount: number;
  rowHeight: number;
  gutterSize: number;
  breakpoints: {
    lg: { columnCount: number; rowHeight: number };
    md: { columnCount: number; rowHeight: number };
    sm: { columnCount: number; rowHeight: number };
    xs: { columnCount: number; rowHeight: number };
  };
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

export interface LayoutParams extends LayoutConfig, LayoutType {}

// Soft delete interfaces for entities that support soft delete (you can extend this as necessary)
export interface SoftDeletable {
  softDelete: SoftDeleteInfo | null;
}

export interface SoftDeleteInfo {
  isDeleted: boolean;
  deletedBy: string;
  deletedAt: string;
}


export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
    createdAt: string;
}

export interface Session {
    id: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
}

export interface AuditTrail {
    id: string;
    userId: string;
    action: string;
    timestamp: string;
    details: any;
}

/**
 * Interface representing an audit trail for tracking user actions in the system.
 */
export interface AuditTrail {
    id: string;
    userId: string;
    action: string;
    performedBy: string;
    performedAt: string;
    timestamp: string;
    details: any;
}

export interface PaginationParams {
    page: number;
    limit: number;
    tenantId: string;
}

/**
 * Interface representing a paginated response.
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

