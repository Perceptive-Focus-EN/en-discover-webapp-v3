import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { DashboardConfig } from '@/types/Dashboard';
import { ObjectId } from 'mongodb';
import { DEFAULT_LAYOUT } from '@/constants/dashboardDefaults';
import { FontFamily, PrimaryColor } from '@/types/Shared/types';
import { BackgroundImage, LayoutParams } from '@/types/Shared/interfaces';

export async function createDashboard(userId: string, tenantId: string, dashboardData: Partial<DashboardConfig>): Promise<DashboardConfig> {
  const { db } = await getCosmosClient();
  const collection = db.collection(COLLECTIONS.DASHBOARDS);

  const newDashboard: DashboardConfig = {
    _id: new ObjectId().toString(),
    userId,
    tenantId,
    name: dashboardData.name || 'Untitled Dashboard',
    description: dashboardData.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isShared: dashboardData.isShared ?? false,
    isPublic: dashboardData.isPublic ?? false,
    isForSale: dashboardData.isForSale ?? false,
    layout: mergeLayouts(DEFAULT_LAYOUT, dashboardData.layout),
    permissions: dashboardData.permissions || {
      roles: [],
      users: [],
    },
    marketplaceSettings: dashboardData.marketplaceSettings,
    price: dashboardData.price,
    widgetIds: dashboardData.widgetIds || [],
  };

  const result = await collection.insertOne({ ...newDashboard, _id: new ObjectId() });
  return { ...newDashboard, _id: newDashboard._id.toString() };
}

function mergeLayouts(defaultLayout: LayoutParams, userLayout?: Partial<LayoutParams>): LayoutParams {
  if (!userLayout) return defaultLayout;

  return {
    type: userLayout.type || defaultLayout.type,
    config: {
      ...defaultLayout.config,
      ...userLayout.config,
      breakpoints: {
        ...defaultLayout.config.breakpoints,
        ...userLayout.config?.breakpoints,
      },
      padding: Array.isArray(userLayout.config?.padding) && userLayout.config.padding.length === 2
        ? userLayout.config.padding
        : defaultLayout.config.padding,
      columnCount: userLayout.config?.columnCount || defaultLayout.config.columnCount,
      rowHeight: userLayout.config?.rowHeight || defaultLayout.config.rowHeight,
      gutterSize: userLayout.config?.gutterSize || defaultLayout.config.gutterSize,
      animationSpeed: userLayout.config?.animationSpeed || defaultLayout.config.animationSpeed,
      rowResizeTolerance: userLayout.config?.rowResizeTolerance || defaultLayout.config.rowResizeTolerance,
      autoResize: userLayout.config?.autoResize ?? defaultLayout.config.autoResize,
    },
    theme: {
      primaryColor: (userLayout.theme?.primaryColor || defaultLayout.theme.primaryColor) as PrimaryColor,
      fontFamily: (userLayout.theme?.fontFamily || defaultLayout.theme.fontFamily) as FontFamily,
      backgroundImage: userLayout.theme?.backgroundImage || defaultLayout.theme.backgroundImage,
    },
    columnCount: userLayout.columnCount || defaultLayout.columnCount,
    rowHeight: userLayout.rowHeight || defaultLayout.rowHeight,
    gutterSize: userLayout.gutterSize || defaultLayout.gutterSize,
    breakpoints: userLayout.breakpoints || defaultLayout.breakpoints,
    rowResizeTolerance: userLayout.rowResizeTolerance || defaultLayout.rowResizeTolerance,
    responsive: userLayout.responsive ?? defaultLayout.responsive,
    maxColumns: userLayout.maxColumns ?? defaultLayout.maxColumns,
    snapToGrid: userLayout.snapToGrid ?? defaultLayout.snapToGrid,
    draggable: userLayout.draggable ?? defaultLayout.draggable,
    resizable: userLayout.resizable ?? defaultLayout.resizable,
    autoResize: userLayout.autoResize ?? defaultLayout.autoResize,
    padding: userLayout.padding ?? defaultLayout.padding,
    animationSpeed: userLayout.animationSpeed ?? defaultLayout.animationSpeed,
  };
}

export async function getUserDashboards(userId: string): Promise<DashboardConfig[]> {
  const { db } = await getCosmosClient();
  const collection = db.collection(COLLECTIONS.DASHBOARDS);

  const dashboards = await collection.find({ userId }).toArray();
  return dashboards.map(dashboard => ({
    ...dashboard,
    _id: dashboard._id.toString(),
  })) as DashboardConfig[];
}

export async function getDashboard(dashboardId: string): Promise<DashboardConfig | null> {
  const { db } = await getCosmosClient();
  const collection = db.collection(COLLECTIONS.DASHBOARDS);

  const dashboard = await collection.findOne({ _id: new ObjectId(dashboardId) });
  return dashboard ? { ...dashboard, _id: dashboard._id.toString() } as DashboardConfig : null;
}

export async function updateDashboard(dashboardId: string, updates: Partial<DashboardConfig>): Promise<DashboardConfig | null> {
  const { db } = await getCosmosClient();
  const collection = db.collection(COLLECTIONS.DASHBOARDS);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(dashboardId) },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );

  if (!result) {
    return null;
  }
  return result.value ? { ...result.value, _id: result.value._id.toString() } as DashboardConfig : null;
}

export async function deleteDashboard(dashboardId: string): Promise<boolean> {
  const { db } = await getCosmosClient();
  const collection = db.collection(COLLECTIONS.DASHBOARDS);

  const result = await collection.deleteOne({ _id: new ObjectId(dashboardId) });
  return result.deletedCount === 1;
}