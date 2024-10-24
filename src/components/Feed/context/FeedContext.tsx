// src/components/Feed/context/FeedContext.tsx

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PostData, FeedPost } from '../types/Post';
import { avatarApi } from '../../../lib/api_s/uploads/avatar';
import { photoApi } from '../../../lib/api_s/uploads/photo';
import { videoApi } from '../../../lib/api_s/uploads/video';
import { feedApi } from '../../../lib/api_s/feed/index';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

// Define the state shape
interface Connection {
  id: string;
  userId: string;
}

interface ConnectionRequest {
  id: string;
  fromUserId: string;
}

interface VideoProcessingStatus {
  postId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
}

interface FeedState {
  posts: FeedPost[];
  connections: Connection[];
  connectionRequests: ConnectionRequest[];
  loading: boolean;
  uploadingAvatar: boolean;
  uploadingPhoto: boolean;
  uploadingVideo: boolean;
  lastUploadedAvatarUrl: string | null;
  lastUploadedPhotoUrl: string | null;
  lastUploadedVideoBlobName: string | null;
}

type FeedAction =
  | { type: 'FETCH_POSTS_START' }
  | { type: 'FETCH_POSTS_SUCCESS'; payload: FeedPost[] }
  | { type: 'ADD_POST'; payload: FeedPost }
  | { type: 'UPDATE_POST'; payload: FeedPost }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'FETCH_CONNECTIONS_START' }
  | { type: 'FETCH_CONNECTIONS_SUCCESS'; payload: Connection[] }
  | { type: 'FETCH_REQUESTS_START' }
  | { type: 'FETCH_REQUESTS_SUCCESS'; payload: ConnectionRequest[] }
  | { type: 'SEND_CONNECTION_REQUEST_SUCCESS'; payload: ConnectionRequest }
  | { type: 'ACCEPT_CONNECTION_REQUEST_SUCCESS'; payload: Connection }
  | { type: 'UPLOAD_AVATAR_START' }
  | { type: 'UPLOAD_AVATAR_SUCCESS'; payload: string }
  | { type: 'UPLOAD_PHOTO_START' }
  | { type: 'UPLOAD_PHOTO_SUCCESS'; payload: string }
  | { type: 'UPLOAD_VIDEO_START' }
  | { type: 'UPLOAD_VIDEO_SUCCESS'; payload: string }
  | { type: 'UPDATE_VIDEO_PROCESSING_STATUS'; payload: { postId: string; status: string } };

const initialState: FeedState = {
  posts: [],
  connections: [],
  connectionRequests: [],
  loading: false,
  uploadingAvatar: false,
  uploadingPhoto: false,
  uploadingVideo: false,
  lastUploadedAvatarUrl: null,
  lastUploadedPhotoUrl: null,
  lastUploadedVideoBlobName: null,
};

const feedReducer = (state: FeedState, action: FeedAction): FeedState => {
  switch (action.type) {
    case 'FETCH_POSTS_START':
      return { ...state, loading: true };
    case 'FETCH_POSTS_SUCCESS':
      return { ...state, loading: false, posts: action.payload };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.id ? action.payload : post
        ),
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter((post) => post.id !== action.payload),
      };
    case 'FETCH_CONNECTIONS_SUCCESS':
      return { ...state, connections: action.payload };
    case 'FETCH_REQUESTS_SUCCESS':
      return { ...state, connectionRequests: action.payload };
    case 'SEND_CONNECTION_REQUEST_SUCCESS':
      return { ...state, connectionRequests: [...state.connectionRequests, action.payload] };
    case 'ACCEPT_CONNECTION_REQUEST_SUCCESS':
      return { ...state, connections: [...state.connections, action.payload] };
    case 'UPLOAD_AVATAR_SUCCESS':
      return { ...state, uploadingAvatar: false, lastUploadedAvatarUrl: action.payload };
    case 'UPLOAD_PHOTO_SUCCESS':
      return { ...state, uploadingPhoto: false, lastUploadedPhotoUrl: action.payload };
    case 'UPLOAD_VIDEO_SUCCESS':
      return { ...state, uploadingVideo: false, lastUploadedVideoBlobName: action.payload };
    case 'UPDATE_VIDEO_PROCESSING_STATUS':
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.postId
            ? { ...post, content: { ...post.content, processingStatus: action.payload.status as 'queued' | 'processing' | 'completed' | 'failed' } }
            : post
        ),
      };
    default:
      return state;
  }
};

interface FeedContextType {
  state: FeedState;
  fetchPosts: () => Promise<void>;
  updatePost: (postId: string, updateData: Partial<PostData>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  fetchConnections: () => Promise<void>;
  fetchConnectionRequests: () => Promise<void>;
  sendConnectionRequest: (userId: string) => Promise<void>;
  acceptConnectionRequest: (userId: string) => Promise<void>;
  updateVideoProcessingStatus: (postId: string, status: string) => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(feedReducer, initialState);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    dispatch({ type: 'FETCH_POSTS_START' });
    const posts = await feedApi.fetchPosts(1, 10, 'recent', []);
    dispatch({ type: 'FETCH_POSTS_SUCCESS', payload: posts });
  }, []);

  const updatePost = useCallback(async (postId: string, updateData: Partial<PostData>) => {
    const updatedPost = await feedApi.updatePost(postId, updateData);
    dispatch({ type: 'UPDATE_POST', payload: updatedPost });
    messageHandler.success('Post updated successfully');
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    await feedApi.deletePost(postId);
    dispatch({ type: 'DELETE_POST', payload: postId });
    messageHandler.success('Post deleted successfully');
  }, []);

  const fetchConnections = useCallback(async () => {
    dispatch({ type: 'FETCH_CONNECTIONS_START' });
    const connections = await feedApi.connections.getConnections();
    dispatch({ type: 'FETCH_CONNECTIONS_SUCCESS', payload: connections });
  }, []);

  const fetchConnectionRequests = useCallback(async () => {
    dispatch({ type: 'FETCH_REQUESTS_START' });
    const requests = await feedApi.connections.getConnectionRequests();
    dispatch({ type: 'FETCH_REQUESTS_SUCCESS', payload: requests });
  }, []);

  const sendConnectionRequest = useCallback(async (userId: string) => {
    await feedApi.connections.send(userId);
    messageHandler.success('Connection request sent');
    await fetchConnectionRequests();
  }, [fetchConnectionRequests]);

  const acceptConnectionRequest = useCallback(async (userId: string) => {
    await feedApi.connections.accept(userId);
    messageHandler.success('Connection request accepted');
    await Promise.all([fetchConnections(), fetchConnectionRequests()]);
  }, [fetchConnections, fetchConnectionRequests]);

  const updateVideoProcessingStatus = useCallback(async (postId: string, status: VideoProcessingStatus['status']) => {
    dispatch({ type: 'UPDATE_VIDEO_PROCESSING_STATUS', payload: { postId, status: status as VideoProcessingStatus['status'] } });

    if (status === 'completed') {
      messageHandler.success('Video processing completed');
    }
  }, []);

  return (
    <FeedContext.Provider
      value={{
        state,
        fetchPosts,
        updatePost,
        deletePost,
        fetchConnections,
        fetchConnectionRequests,
        sendConnectionRequest,
        acceptConnectionRequest,
        updateVideoProcessingStatus,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

// Custom hook to use the feed context
export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

export { FeedProvider };

