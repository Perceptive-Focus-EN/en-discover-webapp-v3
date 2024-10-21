// src/contexts/DashboardContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import dashboardService from '../lib/api_s/dashboard';
import { DashboardConfig, DashboardContextType } from '@/types/Dashboard';
import { useAuth } from './AuthContext';
import { frontendLogger } from '../utils/ErrorHandling/frontendLogger';

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardConfigs, setDashboardConfigs] = useState<DashboardConfig[]>([]);
  const [currentDashboard, setCurrentDashboardState] = useState<DashboardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setDashboardConfigs([]);
      setCurrentDashboardState(null);
    }
  }, [user]);

  useEffect(() => {
    const loadUserDashboards = async () => {
      if (!user || !user._id) return;
      setIsLoading(true);
      try {
        const userDashboards = await dashboardService.getUserDashboards(user._id);
        setDashboardConfigs(userDashboards);
        frontendLogger.info(
          `Loaded ${userDashboards.length} dashboards for user`,
          'Your dashboards have been loaded successfully',
          { userId: user._id, dashboardCount: userDashboards.length }
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboards.';
        setError(new Error(errorMessage));
        frontendLogger.error(
          'Failed to load user dashboards',
          'We encountered an issue while loading your dashboards. Please try again later.',
          { userId: user._id, error: err }
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDashboards();
  }, [user]);

  const setCurrentDashboard = useCallback(async (dashboardId: string) => {
    setIsLoading(true);
    try {
      const dashboardData = await dashboardService.getDashboard(dashboardId);
      setCurrentDashboardState(dashboardData);
      frontendLogger.info(
        `Set current dashboard: ${dashboardData.name}`,
        `You are now viewing the ${dashboardData.name} dashboard`,
        { dashboardId, dashboardName: dashboardData.name }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set current dashboard.';
      setError(new Error(errorMessage));
      frontendLogger.error(
        'Failed to set current dashboard',
        'We couldn\'t load the selected dashboard. Please try again.',
        { dashboardId, error: err }
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewDashboard = useCallback(async (dashboardData: Partial<DashboardConfig>): Promise<string> => {
    if (!user || !user._id || !user.tenantId) {
      throw new Error('User information is not available.');
    }
    setIsLoading(true);
    try {
      const newDashboard = await dashboardService.createDashboard(user._id, user.tenantId, dashboardData);
      setDashboardConfigs(prevDashboards => [...prevDashboards, newDashboard]);
      frontendLogger.info(
        `Created new dashboard: ${newDashboard.name}`,
        'Your new dashboard has been created successfully',
        { userId: user._id, dashboardId: newDashboard._id, dashboardName: newDashboard.name }
      );
      return newDashboard._id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create a new dashboard.';
      setError(new Error(errorMessage));
      frontendLogger.error(
        'Failed to create new dashboard',
        'We couldn\'t create your new dashboard. Please try again.',
        { userId: user._id, tenantId: user.tenantId, error: err }
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateDashboard = useCallback(async (dashboardId: string, updates: Partial<DashboardConfig>): Promise<DashboardConfig> => {
    setIsLoading(true);
    try {
      const updatedDashboard = await dashboardService.updateDashboard(dashboardId, updates);
      setDashboardConfigs(prevDashboards =>
        prevDashboards.map(dashboard => (dashboard._id === dashboardId ? updatedDashboard : dashboard))
      );
      if (currentDashboard && currentDashboard._id === dashboardId) {
        setCurrentDashboardState(updatedDashboard);
      }
      frontendLogger.info(
        `Updated dashboard: ${updatedDashboard.name}`,
        'Your dashboard has been updated successfully',
        { dashboardId, dashboardName: updatedDashboard.name }
      );
      return updatedDashboard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dashboard.';
      setError(new Error(errorMessage));
      frontendLogger.error(
        'Failed to update dashboard',
        'We couldn\'t update your dashboard. Please try again.',
        { dashboardId, error: err }
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentDashboard]);

  const deleteDashboard = useCallback(async (dashboardId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await dashboardService.deleteDashboard(dashboardId);
      setDashboardConfigs(prevDashboards => prevDashboards.filter(dashboard => dashboard._id !== dashboardId));
      if (currentDashboard && currentDashboard._id === dashboardId) {
        setCurrentDashboardState(null);
      }
      frontendLogger.info(
        `Deleted dashboard`,
        'Your dashboard has been deleted successfully',
        { dashboardId }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete dashboard.';
      setError(new Error(errorMessage));
      frontendLogger.error(
        'Failed to delete dashboard',
        'We couldn\'t delete your dashboard. Please try again.',
        { dashboardId, error: err }
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentDashboard]);

  const fetchDashboardData = useCallback(async () => {
    // Implement this method if you need to fetch additional dashboard data
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        dashboardConfigs,
        currentDashboard,
        setCurrentDashboard,
        createNewDashboard,
        updateDashboard,
        deleteDashboard,
        isLoading,
        error,
        isCustomizing,
        setIsCustomizing,
        fetchDashboardData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};