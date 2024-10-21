// src/services/widgetService.ts
import axiosInstance from '../axiosSetup';
import { WidgetInstance, CreateWidgetPayload, AllWidgetTypes } from '../../types/Widgets';
import { DEFAULT_WIDGET } from '@/constants/widgetDefaults';
import { API_ENDPOINTS } from '@/constants/endpointsConstants';

export const widgetService = {
  async getWidgets(dashboardId?: string): Promise<WidgetInstance[]> {
    const endpoint = dashboardId
      ? API_ENDPOINTS.WIDGETS.BY_DASHBOARD(dashboardId)
      : API_ENDPOINTS.WIDGETS.ALL;
    const response = await axiosInstance.get<WidgetInstance[]>(endpoint);
    return response.data;
  },

  async addWidget(
    widgetData: CreateWidgetPayload,
    dashboardId: string
  ): Promise<WidgetInstance> {
    try {
      const newWidget = {
        ...DEFAULT_WIDGET,
        ...widgetData,
      };
      const endpoint = API_ENDPOINTS.WIDGETS.BY_DASHBOARD(dashboardId);
      const response = await axiosInstance.post<WidgetInstance>(endpoint, newWidget);
      return response.data;
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  },

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updateData: Partial<WidgetInstance>
  ): Promise<WidgetInstance> {
    const endpoint = API_ENDPOINTS.WIDGETS.BY_ID(dashboardId, widgetId);
    const response = await axiosInstance.put<WidgetInstance>(endpoint, updateData);
    return response.data;
  },

  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    const endpoint = API_ENDPOINTS.WIDGETS.BY_ID(dashboardId, widgetId);
    await axiosInstance.delete(endpoint);
  },

  async getWidgetData(dashboardId: string, widgetId: string): Promise<any> {
    const response = await axiosInstance.get(API_ENDPOINTS.WIDGETS.DATA(dashboardId, widgetId));
    return response.data;
  },

  async getAllWidgetTypes(): Promise<AllWidgetTypes[]> {
    const response = await axiosInstance.get<AllWidgetTypes[]>(API_ENDPOINTS.WIDGETS.TYPES);
    return response.data;
  },

  async getDashboardPermissions(dashboardId: string): Promise<any> {
    const endpoint = API_ENDPOINTS.WIDGETS.DASHBOARD_PERMISSIONS(dashboardId);
    const response = await axiosInstance.get(endpoint);
    return response.data;
  },
};

export default widgetService;