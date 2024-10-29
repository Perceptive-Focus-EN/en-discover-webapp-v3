import React, { useState, useEffect, useCallback } from 'react';
import { useFeed } from './context/FeedContext';
import { CircularProgress, Typography, Divider } from '@mui/material';
import { MoodCard } from './cards/MoodCard';
import { PhotoCard } from './cards/PhotoCard';
import { VideoCard } from './cards/VideoCard';
import { SurveyCard } from './cards/SurveyCard';
import { TextCard } from './cards/TextCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import { FeedPost, PostType, PostContent, TextContent, SurveyContent, VideoContent, PhotoContent, MoodContent } from './types/Post';
import { ReactionType } from './types/Reaction';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { EmotionId } from './types/Reaction';
import useReactionOperations from './context/useReactionOperations';

interface FeedProps {
  feedType: 'forYou' | 'following' | 'global';
  activeEmotions: number[];
}

function isTextContent(content: any): content is TextContent {
  return (
    typeof content === 'object' &&
    'text' in content &&
    'backgroundColor' in content &&
    'textColor' in content &&
    'fontSize' in content &&
    'alignment' in content &&
    'fontWeight' in content &&
    'padding' in content &&
    'maxLines' in content
  );
}

function isPhotoContent(content: any): content is PhotoContent {
  return (
    typeof content === 'object' &&
    'photos' in content &&
    Array.isArray(content.photos) &&
    'caption' in content
  );
}

function isVideoContent(content: any): content is VideoContent {
  return (
    typeof content === 'object' &&
    'videoUrl' in content &&
    'caption' in content &&
    'processingStatus' in content
  );
}

function isMoodContent(content: any): content is MoodContent {
  return (
    typeof content === 'object' &&
    'mood' in content &&
    'color' in content
  );
}

function isSurveyContent(content: any): content is SurveyContent {
  return (
    typeof content === 'object' &&
    'question' in content &&
    'options' in content &&
    Array.isArray(content.options)
  );
}

const CardComponent: React.FC<FeedPost> = (props) => {
  const { postType, content, ...rest } = props;

  const baseProps = {
    ...rest,
    reactions: props.reactions,
    userAvatar: props.userAvatar || '', // Provide a default empty string
  };

  switch (postType) {
    case 'MOOD':
      if (!isMoodContent(content)) {
        console.error('Invalid MoodContent:', content);
        return null;
      }
      return (
        <MoodCard
          userType={UserAccountTypeEnum.PERSONAL}
          {...baseProps}
          mood={content.mood}
          moodColor={content.color}
          moodVolume=""
        />
      );
    case 'PHOTO':
      if (!isPhotoContent(content)) {
        console.error('Invalid PhotoContent:', content);
        return null;
      }
      return (
        <PhotoCard
          userType={UserAccountTypeEnum.PERSONAL}
          {...baseProps}
          photos={content.photos}
          caption={content.caption}
        />
      );
    case 'VIDEO':
      if (!isVideoContent(content)) {
        console.error('Invalid VideoContent:', content);
        return null;
      }
      return (
        <VideoCard
          userType={UserAccountTypeEnum.PERSONAL}
          {...baseProps}
          blobName={content.blobName || ''}
          videoUrl={content.videoUrl}
          thumbnailUrl={content.thumbnailUrl}
          duration={content.duration || ''}
          caption={content.caption}
          processingStatus={content.processingStatus || 'unavailable'}
          autoplay={content.autoplay}
          muted={content.muted}
          loop={content.loop}
        />
      );
    case 'SURVEY':
      if (!isSurveyContent(content)) {
        console.error('Invalid SurveyContent:', content);
        return null;
      }
      return (
        <SurveyCard
          userType={UserAccountTypeEnum.PERSONAL}
          {...baseProps}
          question={content.question}
          options={content.options}
          backgroundColor={content.backgroundColor}
          questionColor={content.questionColor}
          optionTextColor={content.optionTextColor}
          showResults={content.showResults}
        />
      );
    case 'TEXT':
      if (!isTextContent(content)) {
        console.error('Invalid TextContent:', content);
        return null;
      }
      return (
        <TextCard
          userType={UserAccountTypeEnum.PERSONAL}
          {...baseProps}
          {...content}
        />
      );
    default:
      console.error('Unknown post type:', postType);
      return null;
  }
};

export const Feed: React.FC<FeedProps> = ({ feedType, activeEmotions }) => {
  const { state: { posts }, fetchPosts } = useFeed();
  const reactionOps = useReactionOperations();
  const [hasMore, setHasMore] = useState(true);

  const loadMorePosts = useCallback(async () => {
    try {
      await fetchPosts();
      if (posts.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasMore(false);
    }
  }, [fetchPosts, feedType, activeEmotions,posts.length]);

  useEffect(() => {
    loadMorePosts();
  }, [loadMorePosts, feedType, activeEmotions]);

    const handleReactionSelect = useCallback(async (postId: string, reactionType: ReactionType) => {
    try {
      await reactionOps.updateReaction(postId, reactionType.id);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
    }, [reactionOps]);

  return (
    <InfiniteScroll
      dataLength={posts.length}
      next={loadMorePosts}
      hasMore={hasMore}
      loader={
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <CircularProgress />
        </div>
      }
      endMessage={
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <Divider />
          <Typography variant="body2" color="textSecondary" style={{ marginTop: '16px' }}>
            You've reached the end of the feed
          </Typography>
        </div>
      }
    >
      {posts.map((post, index) => (
        <div key={post.id} style={{ marginBottom: '24px' }}>
          <CardComponent
            {...post}
            onReactionSelect={(reactionType) => handleReactionSelect(post.id, reactionType)}
          />
          {index < posts.length - 1 && <Divider style={{ margin: '16px 0' }} />}
        </div>
      ))}
    </InfiniteScroll>
  );
};

export default Feed;
