// src/contexts/WidgetContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WidgetInstance, WidgetSize, WidgetPosition, CreateWidgetPayload, AllWidgetTypes } from '../types/Widgets';
import { widgetService } from '../lib/api_s/widgetsi';
import { frontendLogger } from '../utils/ErrorHandling/frontendLogger';
import { useAuth } from '../contexts/AuthContext';

export interface WidgetContextType {
  widgets: WidgetInstance[];
  addWidget: (widgetData: CreateWidgetPayload, dashboardId: string) => Promise<WidgetInstance>;
  deleteWidget: (dashboardId: string, widgetId: string) => Promise<void>;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<WidgetInstance>) => Promise<WidgetInstance>;
  setWidgets: React.Dispatch<React.SetStateAction<WidgetInstance[]>>;
  onConfigChange: (widgetId: string, updates: Partial<WidgetInstance>) => void;
  onResize: (widgetId: string, newSize: WidgetSize) => void;
  onMove: (widgetId: string, newPosition: WidgetPosition) => void;
  getWidgetData: (dashboardId: string, widgetId: string) => Promise<any>;
  getAllWidgetTypes: () => Promise<AllWidgetTypes[]>;
  isLoading: boolean;
  error: Error | null;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const WidgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      frontendLogger.setUser(user._id || '');
    }
    frontendLogger.setContext({ component: 'WidgetProvider' });
    return () => {
      frontendLogger.clearContext();
    };
  }, [user]);

  useEffect(() => {
    const loadWidgets = async () => {
      setIsLoading(true);
      try {
        const loadedWidgets = await widgetService.getWidgets();
        setWidgets(loadedWidgets);
      } catch (err) {
        setError(err as Error);
        frontendLogger.error(
          'Failed to load widgets',
          'An error occurred while loading widgets.',
          { error: err }
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadWidgets();
  }, []);

  const addWidget = useCallback(async (widgetData: CreateWidgetPayload, dashboardId: string): Promise<WidgetInstance> => {
    setIsLoading(true);
    frontendLogger.setContext({ action: 'addWidget', dashboardId });
    try {
      const startTime = performance.now();
      const newWidget = await widgetService.addWidget(widgetData, dashboardId);
      const endTime = performance.now();
      frontendLogger.logPerformance('add_widget_duration', endTime - startTime);
      setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
      frontendLogger.info(
        'Widget added successfully',
        'Widget was added successfully.',
        { widgetId: newWidget.id }
      );
      return newWidget;
    } catch (err) {
      setError(err as Error);
      frontendLogger.error(
        'Failed to add widget',
        'An error occurred while adding the widget.',
        { error: err }
      );
      throw err;
    } finally {
      setIsLoading(false);
      frontendLogger.clearContext();
    }
  }, []);

  const updateWidget = useCallback(async (dashboardId: string, widgetId: string, updates: Partial<WidgetInstance>): Promise<WidgetInstance> => {
    setIsLoading(true);
    frontendLogger.setContext({ action: 'updateWidget', dashboardId, widgetId });
    try {
      const startTime = performance.now();
      const updatedWidget = await widgetService.updateWidget(dashboardId, widgetId, updates);
      const endTime = performance.now();
      frontendLogger.logPerformance('update_widget_duration', endTime - startTime);
      setWidgets((prevWidgets) =>
        prevWidgets.map((widget) => (widget.id === widgetId ? { ...widget, ...updatedWidget } : widget))
      );
      frontendLogger.info(
        'Widget updated successfully',
        'Widget was updated successfully.',
        { widgetId }
      );
      return updatedWidget;
    } catch (err) {
      setError(err as Error);
      frontendLogger.error(
        'Failed to update widget',
        'An error occurred while updating the widget.',
        { error: err }
      );
      throw err;
    } finally {
      setIsLoading(false);
      frontendLogger.clearContext();
    }
  }, []);

  const deleteWidget = useCallback(async (dashboardId: string, widgetId: string): Promise<void> => {
    setIsLoading(true);
    frontendLogger.setContext({ action: 'deleteWidget', dashboardId, widgetId });
    try {
      const startTime = performance.now();
      await widgetService.deleteWidget(dashboardId, widgetId);
      const endTime = performance.now();
      frontendLogger.logPerformance('delete_widget_duration', endTime - startTime);
      setWidgets((prevWidgets) => prevWidgets.filter((widget) => widget.id !== widgetId));
      frontendLogger.info(
        'Widget deleted successfully',
        'Widget was deleted successfully.',
        { widgetId }
      );
    } catch (err) {
      setError(err as Error);
      frontendLogger.error(
        'Failed to delete widget',
        'An error occurred while deleting the widget.',
        { error: err }
      );
      throw err;
    } finally {
      setIsLoading(false);
      frontendLogger.clearContext();
    }
  }, []);

  const onConfigChange = useCallback((widgetId: string, updates: Partial<WidgetInstance>) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => (widget.id === widgetId ? { ...widget, ...updates } : widget))
    );
  }, []);

  const onResize = useCallback((widgetId: string, newSize: WidgetSize) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => (widget.id === widgetId ? { ...widget, size: newSize } : widget))
    );
  }, []);

  const onMove = useCallback((widgetId: string, newPosition: WidgetPosition) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => (widget.id === widgetId ? { ...widget, position: newPosition } : widget))
    );
  }, []);

  const getWidgetData = useCallback(async (dashboardId: string, widgetId: string): Promise<any> => {
    return await widgetService.getWidgetData(dashboardId, widgetId);
  }, []);

  const getAllWidgetTypes = useCallback(async (): Promise<AllWidgetTypes[]> => {
    return await widgetService.getAllWidgetTypes();
  }, []);

  return (
    <WidgetContext.Provider value={{
      widgets,
      addWidget,
      updateWidget,
      deleteWidget,
      setWidgets,
      onConfigChange,
      onResize,
      onMove,
      getWidgetData,
      getAllWidgetTypes,
      isLoading,
      error
    }}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidgets = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgets must be used within a WidgetProvider');
  }
  return context;
};
