// src/components/Feed/context/FeedContext.tsx

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { createPost } from '../../../lib/api_s/feed/create-post';
import { connectionsApi } from '../../../lib/api_s/feed/connections';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';
import { useAuth } from '../../../contexts/AuthContext';
import { PostData, FeedPost } from '../types/Post';
import { uploadAvatar } from '../../../lib/api_s/uploads/avatar';
import { uploadPhoto } from '../../../lib/api_s/uploads/photo';
import { uploadVideo, getVideoUrl } from '../../../lib/api_s/uploads/video';

// Define the state shape
interface FeedState {
  posts: FeedPost[];
  connections: any[]; // Update this type as needed
  connectionRequests: any[]; // Update this type as needed
  loading: boolean;
  error: string | null;
  uploadingAvatar: boolean;
  uploadingPhoto: boolean;
  uploadingVideo: boolean;
  lastUploadedAvatarUrl: string | null;
  lastUploadedPhotoUrl: string | null;
  lastUploadedVideoBlobName: string | null;
}

// Define action types
type FeedAction =
  | { type: 'FETCH_POSTS_START' }
  | { type: 'FETCH_POSTS_SUCCESS'; payload: FeedPost[] }
  | { type: 'FETCH_POSTS_ERROR'; payload: string }
  | { type: 'ADD_POST'; payload: FeedPost }
  | { type: 'UPDATE_POST'; payload: FeedPost }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'FETCH_CONNECTIONS_SUCCESS'; payload: any[] }
  | { type: 'FETCH_CONNECTION_REQUESTS_SUCCESS'; payload: any[] }
  | { type: 'SEND_CONNECTION_REQUEST_SUCCESS'; payload: any }
  | { type: 'ACCEPT_CONNECTION_REQUEST_SUCCESS'; payload: any }
  | { type: 'UPLOAD_AVATAR_START' }
  | { type: 'UPLOAD_AVATAR_SUCCESS'; payload: string }
  | { type: 'UPLOAD_AVATAR_ERROR'; payload: string }
  | { type: 'UPLOAD_PHOTO_START' }
  | { type: 'UPLOAD_PHOTO_SUCCESS'; payload: string }
  | { type: 'UPLOAD_PHOTO_ERROR'; payload: string }
  | { type: 'UPLOAD_VIDEO_START' }
  | { type: 'UPLOAD_VIDEO_SUCCESS'; payload: string }
  | { type: 'UPLOAD_VIDEO_ERROR'; payload: string }
  | { type: 'UPDATE_VIDEO_PROCESSING_STATUS'; payload: { postId: string; status: string } };

// Create the initial state
const initialState: FeedState = {
  posts: [],
  connections: [],
  connectionRequests: [],
  loading: false,
  error: null,
  uploadingAvatar: false,
  uploadingPhoto: false,
  uploadingVideo: false,
  lastUploadedAvatarUrl: null,
  lastUploadedPhotoUrl: null,
  lastUploadedVideoBlobName: null,
};

// Create the reducer function
const feedReducer = (state: FeedState, action: FeedAction): FeedState => {
  switch (action.type) {
    case 'FETCH_POSTS_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_POSTS_SUCCESS':
      return { ...state, loading: false, posts: action.payload };
    case 'FETCH_POSTS_ERROR':
      return { ...state, loading: false, error: action.payload };
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
    case 'FETCH_CONNECTION_REQUESTS_SUCCESS':
      return { ...state, connectionRequests: action.payload };
    case 'SEND_CONNECTION_REQUEST_SUCCESS':
    case 'ACCEPT_CONNECTION_REQUEST_SUCCESS':
      // You might want to update the connections or requests here
      return state;
    case 'UPLOAD_AVATAR_START':
      return { ...state, uploadingAvatar: true };
    case 'UPLOAD_AVATAR_SUCCESS':
      return { ...state, uploadingAvatar: false, lastUploadedAvatarUrl: action.payload };
    case 'UPLOAD_AVATAR_ERROR':
      return { ...state, uploadingAvatar: false, error: action.payload };
    case 'UPLOAD_PHOTO_START':
      return { ...state, uploadingPhoto: true };
    case 'UPLOAD_PHOTO_SUCCESS':
      return { ...state, uploadingPhoto: false, lastUploadedPhotoUrl: action.payload };
    case 'UPLOAD_PHOTO_ERROR':
      return { ...state, uploadingPhoto: false, error: action.payload };
    case 'UPLOAD_VIDEO_START':
      return { ...state, uploadingVideo: true };
    case 'UPLOAD_VIDEO_SUCCESS':
      return { ...state, uploadingVideo: false, lastUploadedVideoBlobName: action.payload };
    case 'UPLOAD_VIDEO_ERROR':
      return { ...state, uploadingVideo: false, error: action.payload };
    case 'UPDATE_VIDEO_PROCESSING_STATUS':
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.postId
            ? { ...post, content: { ...post.content, processingStatus: action.payload.status as "queued" | "processing" | "completed" | "failed" } }
            : post
        ),
      };
    default:
      return state;
  }
};

// Create the context
interface FeedContextType {
  state: FeedState;
  createNewPost: (postData: PostData) => Promise<void>;
  fetchPosts: () => Promise<void>;
  updatePost: (postId: string, updateData: Partial<PostData>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  fetchConnections: () => Promise<void>;
  fetchConnectionRequests: () => Promise<void>;
  sendConnectionRequest: (userId: string) => Promise<void>;
  acceptConnectionRequest: (userId: string) => Promise<void>;
  uploadAvatarImage: (file: File) => Promise<string>;
  uploadPostPhoto: (file: File, caption?: string) => Promise<string>;
  uploadPostVideo: (file: File, caption?: string) => Promise<{ blobName: string; videoUrl: string; processingStatus: string }>;
  getVideoUrl: (blobName: string) => Promise<string>;
  updateVideoProcessingStatus: (postId: string, status: string) => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

// Create the provider component
const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(feedReducer, initialState);
  const { user } = useAuth();

  const createNewPost = useCallback(async (postData: PostData) => {
    try {
      console.log('Creating new post:', postData);
      const newPost = await createPost(postData);
      console.log('New post created:', newPost);
      dispatch({ type: 'ADD_POST', payload: newPost });

      // If it's a video post, start checking for processing status updates
      if (newPost.postType === 'VIDEO' && 'processingStatus' in newPost.content && newPost.content.processingStatus !== 'completed') {
        // Implement a function to periodically check and update the processing status
        // This could be a separate function that uses setTimeout or setInterval
        // checkVideoProcessingStatus(newPost.id, newPost.content.blobName);
      }
    } catch (error) {
      frontendLogger.error(
        'Error in createNewPost',
        'Failed to create a new post. Please try again.',
        { error, postData }
      );
    }
  }, []);
  
  const fetchPosts = useCallback(async () => {
    dispatch({ type: 'FETCH_POSTS_START' });
    try {
      // Implement the API call to fetch posts
      // const posts = await fetchPostsFromAPI();
      // dispatch({ type: 'FETCH_POSTS_SUCCESS', payload: posts });
    } catch (error) {
      frontendLogger.error(
        'Error in fetchPosts',
        'Failed to fetch posts. Please try refreshing the page.',
        { error }
      );
      dispatch({ type: 'FETCH_POSTS_ERROR', payload: 'Failed to fetch posts' });
    }
  }, []);

  const updatePost = useCallback(async (postId: string, updateData: Partial<PostData>) => {
    try {
      // Implement the API call to update a post
      // const updatedPost = await updatePostInAPI(postId, updateData);
      // dispatch({ type: 'UPDATE_POST', payload: updatedPost });
    } catch (error) {
      frontendLogger.error(
        'Error in updatePost',
        'Failed to update the post. Please try again.',
        { error, postId }
      );
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      // Implement the API call to delete a post
      // await deletePostFromAPI(postId);
      dispatch({ type: 'DELETE_POST', payload: postId });
    } catch (error) {
      frontendLogger.error(
        'Error in deletePost',
        'Failed to delete the post. Please try again.',
        { error, postId }
      );
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      const response = await connectionsApi.getConnections();
      dispatch({ type: 'FETCH_CONNECTIONS_SUCCESS', payload: response.data });
    } catch (error) {
      frontendLogger.error('Error fetching connections', 'Failed to fetch connections', { error });
    }
  }, []);

  const fetchConnectionRequests = useCallback(async () => {
    try {
      const response = await connectionsApi.getConnectionRequests();
      dispatch({ type: 'FETCH_CONNECTION_REQUESTS_SUCCESS', payload: response.data });
    } catch (error) {
      frontendLogger.error('Error fetching connection requests', 'Failed to fetch connection requests', { error });
    }
  }, []);

  const sendConnectionRequest = useCallback(async (userId: string) => {
    try {
      const result = await connectionsApi.sendConnectionRequest(userId);
      dispatch({ type: 'SEND_CONNECTION_REQUEST_SUCCESS', payload: result });
    } catch (error) {
      frontendLogger.error('Error sending connection request', 'Failed to send connection request', { error, userId });
    }
  }, []);

  const acceptConnectionRequest = useCallback(async (userId: string) => {
    try {
      const result = await connectionsApi.acceptConnectionRequest(userId);
      dispatch({ type: 'ACCEPT_CONNECTION_REQUEST_SUCCESS', payload: result });
    } catch (error) {
      frontendLogger.error('Error accepting connection request', 'Failed to accept connection request', { error, userId });
    }
  }, []);

  const uploadAvatarImage = useCallback(async (file: File) => {
    dispatch({ type: 'UPLOAD_AVATAR_START' });
    try {
      const result = await uploadAvatar(file);
      dispatch({ type: 'UPLOAD_AVATAR_SUCCESS', payload: result.avatarUrl });
      return result.avatarUrl;
    } catch (error) {
      frontendLogger.error('Error uploading avatar', 'Failed to upload avatar', { error });
      dispatch({ type: 'UPLOAD_AVATAR_ERROR', payload: 'Failed to upload avatar' });
      throw error;
    }
  }, []);

  const uploadPostPhoto = useCallback(async (file: File, caption?: string) => {
    dispatch({ type: 'UPLOAD_PHOTO_START' });
    try {
      const result = await uploadPhoto(file, caption);
      dispatch({ type: 'UPLOAD_PHOTO_SUCCESS', payload: result.photoUrl });
      return result.photoUrl;
    } catch (error) {
      frontendLogger.error('Error uploading photo', 'Failed to upload photo', { error });
      dispatch({ type: 'UPLOAD_PHOTO_ERROR', payload: 'Failed to upload photo' });
      throw error;
    }
  }, []);

  const uploadPostVideo = useCallback(async (file: File, caption?: string): Promise<{ blobName: string; videoUrl: string; processingStatus: string }> => {
    dispatch({ type: 'UPLOAD_VIDEO_START' });
    try {
      const result = await uploadVideo(file, caption);
      dispatch({ type: 'UPLOAD_VIDEO_SUCCESS', payload: result.blobName });
      return {
        blobName: result.blobName,
        videoUrl: result.videoUrl,
        processingStatus: result.processingStatus
      };
    } catch (error) {
      frontendLogger.error('Error uploading video', 'Failed to upload video', { error });
      dispatch({ type: 'UPLOAD_VIDEO_ERROR', payload: 'Failed to upload video' });
      throw error;
    }
  }, []);

  const getVideoUrlWrapper = useCallback(async (blobName: string): Promise<string> => {
    try {
      return await getVideoUrl(blobName);
    } catch (error) {
      frontendLogger.error('Error fetching video URL', 'Failed to fetch video URL', { error, blobName });
      throw error;
    }
  }, []);

  const updateVideoProcessingStatus = useCallback(async (postId: string, status: string) => {
    try {
      // You might want to call an API to update the status on the server
      // await updateVideoProcessingStatusOnServer(postId, status);
      dispatch({ type: 'UPDATE_VIDEO_PROCESSING_STATUS', payload: { postId, status } });
    } catch (error) {
      frontendLogger.error(
        'Error updating video processing status',
        'Failed to update video processing status',
        { error, postId, status }
      );
    }
  }, []);

  return (
    <FeedContext.Provider
      value={{
        state,
        createNewPost,
        fetchPosts,
        updatePost,
        deletePost,
        fetchConnections,
        fetchConnectionRequests,
        sendConnectionRequest,
        acceptConnectionRequest,
        uploadAvatarImage,
        uploadPostPhoto,
        uploadPostVideo,
        getVideoUrl: getVideoUrlWrapper,
        updateVideoProcessingStatus,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

// Create a custom hook to use the feed context
export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

export { FeedProvider };