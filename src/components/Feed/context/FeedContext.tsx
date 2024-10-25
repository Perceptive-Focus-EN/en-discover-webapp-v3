// src/components/Feed/context/FeedContext.tsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PostData, FeedPost } from '../types/Post';
import { avatarApi } from '../../../lib/api_s/uploads/avatar';
import { photoApi } from '../../../lib/api_s/uploads/photo';
import { videoApi } from '../../../lib/api_s/uploads/video';
import { feedApi } from '../../../lib/api_s/feed/index';
import { postReactionsApi } from '../../../lib/api_s/reactions/postReactions';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

// Interfaces
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

interface UploadHandlers {
  handleAvatarUpload: (file: File) => Promise<string>;
  handlePhotoUpload: (file: File, caption?: string) => Promise<string>;
  handleVideoUpload: (file: File, caption?: string) => Promise<{ blobName: string; videoUrl: string }>;
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

interface FeedContextType extends UploadHandlers {
  state: FeedState;
  fetchPosts: () => Promise<void>;
  updatePost: (postId: string, updateData: Partial<PostData>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  fetchConnections: () => Promise<void>;
  fetchConnectionRequests: () => Promise<void>;
  sendConnectionRequest: (userId: string) => Promise<void>;
  acceptConnectionRequest: (userId: string) => Promise<void>;
  updateVideoProcessingStatus: (postId: string, status: string) => Promise<void>;
  fetchReactions: (postId: string) => Promise<void>;
  updateReaction: (postId: string, emotionId: string) => Promise<void>;
}

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

// Reducer
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
            ? { ...post, videoProcessingStatus: { status: action.payload.status } }
            : post
        ),
      };
    default:
      return state;
  }
};

const FeedContext = createContext<FeedContextType | undefined>(undefined);

const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(feedReducer, initialState);
  const { user } = useAuth();

  // Handle Avatar Upload
  const handleAvatarUpload = useCallback(async (file: File): Promise<string> => {
    dispatch({ type: 'UPLOAD_AVATAR_START' });
    try {
      const response = await avatarApi.upload(file);
      dispatch({ type: 'UPLOAD_AVATAR_SUCCESS', payload: response.avatarUrl });
      messageHandler.success('Avatar uploaded successfully');
      return response.avatarUrl;
    } catch (error) {
      messageHandler.error('Failed to upload avatar');
      throw error;
    }
  }, []);

  // Handle Photo Upload
  const handlePhotoUpload = useCallback(async (file: File, caption?: string): Promise<string> => {
    dispatch({ type: 'UPLOAD_PHOTO_START' });
    try {
      const response = await photoApi.upload(file, caption);
      dispatch({ type: 'UPLOAD_PHOTO_SUCCESS', payload: response.photoUrl });
      messageHandler.success('Photo uploaded successfully');
      return response.photoUrl;
    } catch (error) {
      messageHandler.error('Failed to upload photo');
      throw error;
    }
  }, []);

  // Handle Video Upload
  const handleVideoUpload = useCallback(async (file: File, caption?: string) => {
    dispatch({ type: 'UPLOAD_VIDEO_START' });
    try {
      const response = await videoApi.upload(file, caption);
      dispatch({ type: 'UPLOAD_VIDEO_SUCCESS', payload: response.blobName });
      messageHandler.success('Video uploaded successfully');
      return {
        blobName: response.blobName,
        videoUrl: response.videoUrl
      };
    } catch (error) {
      messageHandler.error('Failed to upload video');
      throw error;
    }
  }, []);

  return (
    <FeedContext.Provider
      value={{
        state,
        handleAvatarUpload,
        handlePhotoUpload,
        handleVideoUpload,
        fetchPosts: async () => {}, // Placeholder, to be implemented
        updatePost: async () => {}, // Placeholder, to be implemented
        deletePost: async () => {}, // Placeholder, to be implemented
        fetchConnections: async () => {}, // Placeholder, to be implemented
        fetchConnectionRequests: async () => {}, // Placeholder, to be implemented
        sendConnectionRequest: async () => {}, // Placeholder, to be implemented
        acceptConnectionRequest: async () => {}, // Placeholder, to be implemented
        updateVideoProcessingStatus: async () => {}, // Placeholder, to be implemented
        fetchReactions: async () => {}, // Placeholder, to be implemented
        updateReaction: async () => {}, // Placeholder, to be implemented
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

export { FeedProvider };
