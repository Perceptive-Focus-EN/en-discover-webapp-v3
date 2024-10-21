// src/constants/dashboardDefaults.ts
import { LayoutParams, ThemeConfig } from '@/types/Shared/interfaces';

const defaultTheme: ThemeConfig = {
  primaryColor: 'blue',
  fontFamily: 'Arial',
  backgroundImage: {
    file: 'default-background.jpg',
    url: '/path-to-background',
    alt: 'Default background'
  }
};

const defaultConfig: LayoutParams['config'] = {
  columnCount: 12,
  rowHeight: 30,
  gutterSize: 10,
  breakpoints: {
    lg: { columnCount: 12, rowHeight: 30 },
    md: { columnCount: 8, rowHeight: 25 },
    sm: { columnCount: 6, rowHeight: 20 },
    xs: { columnCount: 4, rowHeight: 15 },
  },
  responsive: true,
  maxColumns: 12,
  snapToGrid: true,
  draggable: true,
  resizable: true,
  autoResize: false,
  rowResizeTolerance: 5,
  padding: [20, 20],
  animationSpeed: 300,
};

export const DEFAULT_LAYOUT: LayoutParams = {
  type: 'grid',
  config: defaultConfig,
  theme: defaultTheme,
  columnCount: 0,
  rowHeight: 0,
  gutterSize: 0,
  breakpoints: {
    lg: {
      columnCount: 0,
      rowHeight: 0
    },
    md: {
      columnCount: 0,
      rowHeight: 0
    },
    sm: {
      columnCount: 0,
      rowHeight: 0
    },
    xs: {
      columnCount: 0,
      rowHeight: 0
    }
  },
  responsive: false,
  maxColumns: 0,
  snapToGrid: false,
  draggable: false,
  resizable: false,
  autoResize: false,
  rowResizeTolerance: 0,
  padding: [0, 0],
  animationSpeed: 0
};