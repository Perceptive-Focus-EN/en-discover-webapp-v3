// src/components/Resources/hooks/useResourceActions.ts
import { useCallback, useState } from 'react';
import { resourcesApi } from '../api/resourcesApi';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { 
  Resource,
  ResourceActionResult,
  ActionLoadingState,
  ResourceActionHookReturn,
  ResourcePermissions,
  ResourceStatus,
  ResourceVisibility
} from '../../../types/ArticleMedia';

export const useResourceActions = (
  permissions?: ResourcePermissions
): ResourceActionHookReturn => {
  const [loading, setLoading] = useState<ActionLoadingState>({});

  const handleBookmark = useCallback(async (
    id: string
  ): Promise<ResourceActionResult<boolean>> => {
    try {
      setLoading(prev => ({ ...prev, [`bookmark-${id}`]: true }));
      const response = await resourcesApi.bookmarkResource(id);
      
      messageHandler.success(
        response.bookmarked 
          ? 'Resource bookmarked successfully!' 
          : 'Resource removed from bookmarks'
      );
      
      return {
        success: true,
        data: response.bookmarked,
        message: response.bookmarked 
          ? 'Resource bookmarked successfully' 
          : 'Resource removed from bookmarks'
      };
    } catch (error) {
      messageHandler.error('Failed to bookmark resource');
      return {
        success: false,
        error: 'Failed to bookmark resource'
      };
    } finally {
      setLoading(prev => ({ ...prev, [`bookmark-${id}`]: false }));
    }
  }, []);

  const handleRate = useCallback(async (
    id: string, 
    rating: number
  ): Promise<ResourceActionResult<Resource>> => {
    if (!permissions?.canView) {
      return {
        success: false,
        error: 'You do not have permission to rate this resource'
      };
    }

    try {
      setLoading(prev => ({ ...prev, [`rate-${id}`]: true }));
      const response = await resourcesApi.rateResource(id, rating);
      
      messageHandler.success('Rating submitted successfully');
      
      return {
          success: true,
          message: 'Rating submitted successfully',
      };
    } catch (error) {
      messageHandler.error('Failed to submit rating');
      return {
        success: false,
        error: 'Failed to submit rating'
      };
    } finally {
      setLoading(prev => ({ ...prev, [`rate-${id}`]: false }));
    }
  }, [permissions]);

  const handleDelete = useCallback(async (
    id: string
  ): Promise<ResourceActionResult<boolean>> => {
    if (!permissions?.canDelete) {
      return {
        success: false,
        error: 'You do not have permission to delete this resource'
      };
    }

    try {
      setLoading(prev => ({ ...prev, [`delete-${id}`]: true }));
      await resourcesApi.deleteResource(id);
      
      messageHandler.success('Resource deleted successfully');
      
      return {
        success: true,
        data: true,
        message: 'Resource deleted successfully'
      };
    } catch (error) {
      messageHandler.error('Failed to delete resource');
      return {
        success: false,
        error: 'Failed to delete resource'
      };
    } finally {
      setLoading(prev => ({ ...prev, [`delete-${id}`]: false }));
    }
  }, [permissions]);

  const handleUpdateStatus = useCallback(async (
    id: string,
    status: ResourceStatus
  ): Promise<ResourceActionResult<Resource>> => {
    if (!permissions?.canEdit) {
      return {
        success: false,
        error: 'You do not have permission to update resource status'
      };
    }

    try {
      setLoading(prev => ({ ...prev, [`status-${id}`]: true }));
      const response = await resourcesApi.updateResourceStatus(id, status);
      
      messageHandler.success('Resource status updated successfully');
      
      return {
        success: true,
        data: response.data,
        message: 'Resource status updated successfully'
      };
    } catch (error) {
      messageHandler.error('Failed to update resource status');
      return {
        success: false,
        error: 'Failed to update resource status'
      };
    } finally {
      setLoading(prev => ({ ...prev, [`status-${id}`]: false }));
    }
  }, [permissions]);

  const handleUpdateVisibility = useCallback(async (
    id: string,
    visibility: ResourceVisibility
  ): Promise<ResourceActionResult<Resource>> => {
    if (!permissions?.canEdit) {
      return {
        success: false,
        error: 'You do not have permission to update resource visibility'
      };
    }

    try {
      setLoading(prev => ({ ...prev, [`visibility-${id}`]: true }));
      const response = await resourcesApi.updateResourceVisibility(id, visibility);
      
      messageHandler.success('Resource visibility updated successfully');
      
      return {
        success: true,
        data: response.data,
        message: 'Resource visibility updated successfully'
      };
    } catch (error) {
      messageHandler.error('Failed to update resource visibility');
      return {
        success: false,
        error: 'Failed to update resource visibility'
      };
    } finally {
      setLoading(prev => ({ ...prev, [`visibility-${id}`]: false }));
    }
  }, [permissions]);

  const isLoading = useCallback((actionType: string, id: string): boolean => {
    return loading[`${actionType}-${id}`] || false;
  }, [loading]);

  return {
    handleBookmark,
    handleRate,
    handleDelete,
    handleUpdateStatus,
    handleUpdateVisibility,
    isLoading,
    loading
  };
};

export default useResourceActions;