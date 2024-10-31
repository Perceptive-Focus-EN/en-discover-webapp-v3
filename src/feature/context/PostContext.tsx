import React, { createContext, useReducer, useCallback } from 'react';
import { CreatePostDTO, Post, UpdatePostDTO } from '../posts/api/types';
import { postApi } from '../posts/api/postApi';
import { PaginationParams, PaginationMetadata, PaginatedResponse } from '@/types/pagination';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

// Debug constant to control logs
const DEBUG = process.env.NODE_ENV === 'development';

// Type guard for Post validation
function isValidPost(post: any): post is Post {
  return (
    post &&
    typeof post.id === 'string' &&
    typeof post.userId === 'string' &&
    Array.isArray(post.username) &&
    post.username.length === 2 &&
    typeof post.username[0] === 'string' &&
    typeof post.username[1] === 'string' &&
    typeof post.type === 'string' &&
    ['TEXT', 'PHOTO', 'VIDEO', 'MOOD', 'SURVEY'].includes(post.type) &&
    typeof post.createdAt === 'string' &&
    typeof post.updatedAt === 'string' &&
    Array.isArray(post.reactions) &&
    typeof post.commentCount === 'number' &&
    (!post.media || (
      Array.isArray(post.media.urls) &&
      (!post.media.thumbnails || Array.isArray(post.media.thumbnails))
    )) &&
    (!post.visibility || ['public', 'private', 'connections'].includes(post.visibility))
  );
}

export interface PostState {
  posts: Record<string, Post>;
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  nextCursor?: string;
  filters: {
    type?: Post['type'];
    userId?: string;
    status?: Post['status'];
  };
}

const initialState: PostState = {
  posts: {},
  loading: false,
  error: null,
  currentPage: 1,
  hasMore: true,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
  nextCursor: undefined,
  filters: {},
};

export type PostAction =
  | { type: 'SET_POSTS'; payload: { posts: Post[]; pagination: PaginationMetadata } }
  | { type: 'ADD_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: Post }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: PostState['filters'] }
  | { type: 'RESET_POSTS' }
  | { type: 'SET_HAS_MORE'; payload: boolean };

function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case 'SET_POSTS': {
      const { posts, pagination } = action.payload;
      const newPosts = posts.reduce((acc, post) => {
        if (isValidPost(post)) {
          acc[post.id] = post;
        } else if (DEBUG) {
          console.warn('Received invalid post:', post);
        }
        return acc;
      }, {} as Record<string, Post>);
      return {
        ...state,
        posts: newPosts,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemsPerPage: pagination.itemsPerPage,
        hasMore: pagination.hasNextPage,
        nextCursor: pagination.nextCursor,
      };
    }
    case 'ADD_POSTS': {
      const newPosts = action.payload.reduce((acc, post) => {
        if (isValidPost(post)) {
          acc[post.id] = post;
        } else if (DEBUG) {
          console.warn('Received invalid post:', post);
        }
        return acc;
      }, {} as Record<string, Post>);
      return {
        ...state,
        posts: { ...state.posts, ...newPosts },
      };
    }
    case 'ADD_POST': {
      if (!isValidPost(action.payload)) {
        if (DEBUG) console.error('Attempted to add an invalid post:', action.payload);
        return state;
      }
      return {
        ...state,
        posts: { ...state.posts, [action.payload.id]: action.payload },
      };
    }
    case 'UPDATE_POST': {
      if (!isValidPost(action.payload)) {
        if (DEBUG) console.error('Attempted to update an invalid post:', action.payload);
        return state;
      }
      return {
        ...state,
        posts: { ...state.posts, [action.payload.id]: action.payload },
      };
    }
    case 'DELETE_POST': {
      const { [action.payload]: deleted, ...remainingPosts } = state.posts;
      return { ...state, posts: remainingPosts };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };
    case 'RESET_POSTS':
      return {
        ...initialState,
        filters: state.filters,
      };
    default:
      return state;
  }
}

export interface PostContextValue {
  state: PostState;
  fetchPosts: (page?: number, refresh?: boolean, params?: PaginationParams) => Promise<void>;
  createPost: (data: CreatePostDTO) => Promise<Post>;
  updatePost: (data: UpdatePostDTO) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  setFilters: (filters: PostState['filters']) => void;
}

export const PostContext = createContext<PostContextValue | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(postReducer, initialState);

  const fetchPosts = useCallback(async (
    page?: number,
    refresh = false,
    params: PaginationParams = {}
  ) => {
    if (refresh) {
      dispatch({ type: 'RESET_POSTS' });
    }

    const targetPage = page || (refresh ? 1 : state.currentPage);

    if (!refresh && !state.hasMore) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response: PaginatedResponse<Post> = await postApi.list({
        page: targetPage,
        limit: state.itemsPerPage,
        ...params,
        filter: {
          ...params.filter,
          ...state.filters,
        },
      });

      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }

      const validPosts = response.data.filter(isValidPost);
      if (DEBUG && validPosts.length !== response.data.length) {
        console.warn('Some posts were invalid and filtered out', {
          total: response.data.length,
          valid: validPosts.length,
          invalid: response.data.filter(post => !isValidPost(post)),
        });
      }

      if (refresh) {
        dispatch({
          type: 'SET_POSTS',
          payload: {
            posts: validPosts,
            pagination: response.pagination,
          },
        });
      } else {
        dispatch({
          type: 'ADD_POSTS',
          payload: validPosts,
        });
      }

      if (!response.pagination.hasNextPage) {
        dispatch({ type: 'SET_HAS_MORE', payload: false });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch posts';
      dispatch({ type: 'SET_ERROR', payload: message });
      messageHandler.error(message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentPage, state.hasMore, state.itemsPerPage, state.filters]);

  const createPost = useCallback(async (data: CreatePostDTO): Promise<Post> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await postApi.create(data);
      if (!isValidPost(response)) {
        throw new Error('Invalid response from server: missing or incorrect post data');
      }

      // Initialize reactions and metrics
      response.reactions = [
      ];



      dispatch({ type: 'ADD_POST', payload: response });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create post';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updatePost = useCallback(async (data: UpdatePostDTO): Promise<Post> => {
    try {
      const response = await postApi.update(data);
      if (!isValidPost(response)) {
        throw new Error('Invalid response from server: missing or incorrect post data');
      }
      dispatch({ type: 'UPDATE_POST', payload: response });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update post';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const deletePost = useCallback(async (id: string): Promise<void> => {
    try {
      await postApi.delete(id);
      dispatch({ type: 'DELETE_POST', payload: id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete post';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const setFilters = useCallback((filters: PostState['filters']) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const value: PostContextValue = {
    state,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    setFilters,
  };

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};
