// src/services/dashboardService.ts
import { DashboardConfig } from '@/types/Dashboard';
import axiosInstance from '../axiosSetup';
import { frontendLogger } from '../../utils/ErrorHandling/frontendLogger';

const dashboardService = {
  async createDashboard(
    userId: string,
    tenantId: string,
    dashboardData: Partial<DashboardConfig>
  ): Promise<DashboardConfig> {
    try {
      const newDashboard = {
        ...dashboardData,
        userId,
        tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const response = await axiosInstance.post(`/api/dashboards`, newDashboard);
      frontendLogger.info(
        'Dashboard created successfully',
        'Your new dashboard has been created',
        { userId, tenantId, dashboardId: response.data._id }
      );
      return response.data;
    } catch (error) {
      frontendLogger.error(
        'Failed to create dashboard',
        'We couldn\'t create your dashboard at this time. Please try again later.',
        { userId, tenantId, error }
      );
      throw new Error(`Failed to create dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async addWidgetToDashboard(dashboardId: string, widgetId: string): Promise<DashboardConfig> {
    try {
      const response = await axiosInstance.post(`/api/dashboards/${dashboardId}/widgets`, { widgetId });
      frontendLogger.info(
        'Widget added to dashboard',
        'The widget has been added to your dashboard',
        { dashboardId, widgetId }
      );
      return response.data;
    } catch (error) {
      frontendLogger.error(
        'Failed to add widget to dashboard',
        'We couldn\'t add the widget to your dashboard. Please try again.',
        { dashboardId, widgetId, error }
      );
      throw new Error(`Failed to add widget to dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async removeWidgetFromDashboard(dashboardId: string, widgetId: string): Promise<DashboardConfig> {
    try {
      const response = await axiosInstance.delete(`/api/dashboards/${dashboardId}/widgets/${widgetId}`);
      frontendLogger.info(
        'Widget removed from dashboard',
        'The widget has been removed from your dashboard',
        { dashboardId, widgetId }
      );
      return response.data;
    } catch (error) {
      frontendLogger.error(
        'Failed to remove widget from dashboard',
        'We couldn\'t remove the widget from your dashboard. Please try again.',
        { dashboardId, widgetId, error }
      );
      throw new Error(`Failed to remove widget from dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getDashboard(dashboardId: string): Promise<DashboardConfig> {
    try {
      const response = await axiosInstance.get(`/api/dashboards/${dashboardId}`);
      frontendLogger.info(
        'Dashboard retrieved successfully',
        'Your dashboard has been loaded',
        { dashboardId }
      );
      return response.data;
    } catch (error) {
      frontendLogger.error(
        'Failed to get dashboard',
        'We couldn\'t load your dashboard at this time. Please try again later.',
        { dashboardId, error }
      );
      throw new Error(`Failed to get dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateDashboard(dashboardId: string, updateData: Partial<DashboardConfig>): Promise<DashboardConfig> {
    try {
      const response = await axiosInstance.put<DashboardConfig>(`/api/dashboards/${dashboardId}`, updateData);
      frontendLogger.info(
        'Dashboard updated successfully',
        'Your dashboard has been updated',
        { dashboardId }
      );
      return response.data;
    } catch (error) {
      frontendLogger.error(
        'Failed to update dashboard',
        'We couldn\'t update your dashboard. Please try again.',
        { dashboardId, error }
      );
      throw new Error(`Failed to update dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/api/dashboards/${dashboardId}`);
      frontendLogger.info(
        'Dashboard deleted successfully',
        'Your dashboard has been deleted',
        { dashboardId }
      );
    } catch (error) {
      frontendLogger.error(
        'Failed to delete dashboard',
        'We couldn\'t delete your dashboard. Please try again.',
        { dashboardId, error }
      );
      throw new Error(`Failed to delete dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getUserDashboards(userId: string): Promise<DashboardConfig[]> {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}/dashboards`);
      frontendLogger.info(
        'User dashboards retrieved successfully',
        'Your dashboards have been loaded',
        { userId, count: response.data.length }
      );
      return response.data;
    } catch (error) {
      frontendLogger.error(
        'Failed to get user dashboards',
        'We couldn\'t load your dashboards at this time. Please try again later.',
        { userId, error }
      );
      throw new Error(`Failed to get user dashboards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export default dashboardService;