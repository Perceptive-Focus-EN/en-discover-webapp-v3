import { useFeed } from './FeedContext';
import { feedApi } from '@/lib/api_s/feed';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { videoApi } from '@/lib/api_s/uploads/video';

// Custom hook to handle feed operations
const useFeedOperations = () => {
  const createNewPost = async (postData: any) => {
    try {
      await feedApi.createPost(postData);
      messageHandler.success('Post created successfully');
    } catch (error) {
      messageHandler.error('Failed to create post');
      throw error;
    }
  };

  const uploadPostVideo = async (file: File, caption: string) => {
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('caption', caption);

      const response = await videoApi.upload(formData);
      return {
        blobName: response.blobName,
        videoUrl: response.videoUrl,
        thumbnailUrl: response.thumbnailUrl,
        processingStatus: response.processingStatus
      };
    } catch (error) {
      messageHandler.error('Failed to upload video');
      throw error;
    }
  };

  const getVideoUrl = async (blobName: string): Promise<string> => {
    try {
      const response = await videoApi.getVideoUrl(blobName);
      return response.videoUrl;
    } catch (error) {
      messageHandler.error('Failed to get video URL');
      throw error;
    }
  };

  return {
    createNewPost,
    uploadPostVideo,
    getVideoUrl
  };
};

export default useFeedOperations;