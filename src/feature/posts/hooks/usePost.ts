// src/features/posts/hooks/usePost.ts
import { useContext, useCallback } from 'react';
import { Post, CreatePostDTO, UpdatePostDTO } from '../api/types';
import { PostContext } from '../../context/PostContext';
import { PaginationParams } from '@/types/pagination';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface UsePostReturn {
  // State
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;

  // Pagination
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchPage: (page: number) => Promise<void>;

  // Post Operations
  createPost: (data: CreatePostDTO) => Promise<Post>;
  updatePost: (data: UpdatePostDTO) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;

  // Filtering
  filterByType: (type: Post['type']) => Promise<void>;
  filterByUser: (userId: string) => Promise<void>;

  // Additional Operations
  getPostById: (id: string) => Post | undefined;
  clearFilters: () => void;
}

export const usePost = (): UsePostReturn => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }

  const { 
    state, 
    fetchPosts, 
    createPost: contextCreatePost, 
    updatePost: contextUpdatePost, 
    deletePost: contextDeletePost, 
    setFilters 
  } = context;

  const loadMore = useCallback(async () => {
    if (!state.loading && state.hasMore) {
      try {
        await fetchPosts(state.currentPage + 1);
      } catch (error) {
        messageHandler.error('Failed to load more posts');
        console.error('Load more error:', error);
      }
    }
  }, [state.loading, state.hasMore, state.currentPage, fetchPosts]);

  const refresh = useCallback(async () => {
    try {
      await fetchPosts(1, true);
      messageHandler.success('Posts refreshed');
    } catch (error) {
      messageHandler.error('Failed to refresh posts');
      console.error('Refresh error:', error);
    }
  }, [fetchPosts]);

  const fetchPage = useCallback(async (page: number) => {
    try {
      await fetchPosts(page);
    } catch (error) {
      messageHandler.error('Failed to fetch page');
      console.error('Fetch page error:', error);
    }
  }, [fetchPosts]);

  const createPost = useCallback(async (data: CreatePostDTO): Promise<Post> => {
    try {
      const newPost = await contextCreatePost(data);
      messageHandler.success('Post created successfully');
      return newPost;
    } catch (error) {
      messageHandler.error('Failed to create post');
      throw error;
    }
  }, [contextCreatePost]);

  const updatePost = useCallback(async (data: UpdatePostDTO): Promise<Post> => {
    try {
      const updatedPost = await contextUpdatePost(data);
      messageHandler.success('Post updated successfully');
      return updatedPost;
    } catch (error) {
      messageHandler.error('Failed to update post');
      throw error;
    }
  }, [contextUpdatePost]);

  const deletePost = useCallback(async (id: string): Promise<void> => {
    try {
      await contextDeletePost(id);
      messageHandler.success('Post deleted successfully');
    } catch (error) {
      messageHandler.error('Failed to delete post');
      throw error;
    }
  }, [contextDeletePost]);

  const filterByType = useCallback(async (type: Post['type']) => {
    try {
      setFilters({ ...state.filters, type });
      await fetchPosts(1, true);
    } catch (error) {
      messageHandler.error('Failed to filter posts by type');
      console.error('Filter by type error:', error);
    }
  }, [fetchPosts, setFilters, state.filters]);

  const filterByUser = useCallback(async (userId: string) => {
    try {
      setFilters({ ...state.filters, userId });
      await fetchPosts(1, true);
    } catch (error) {
      messageHandler.error('Failed to filter posts by user');
      console.error('Filter by user error:', error);
    }
  }, [fetchPosts, setFilters, state.filters]);

  const getPostById = useCallback((id: string) => {
    return state.posts[id];
  }, [state.posts]);

  const clearFilters = useCallback(() => {
    setFilters({});
    refresh();
  }, [setFilters, refresh]);

  return {
    // State
    posts: Object.values(state.posts),
    isLoading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalItems: state.totalItems,

    // Pagination
    loadMore,
    refresh,
    fetchPage,

    // Post Operations
    createPost,
    updatePost,
    deletePost,

    // Filtering
    filterByType,
    filterByUser,

    // Additional Operations
    getPostById,
    clearFilters
  };
};
