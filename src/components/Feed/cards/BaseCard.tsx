// src/components/Feed/cards/BaseCard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CircularProgress } from '@mui/material';
import { CardHeader } from '../CardHeader';
import { CardFooter } from '../CardFooter';
import { UserTypeBadge } from './PostingUsersBadge';
import { UserAccountType, UserAccountTypeEnum } from '../../../constants/AccessKey/accounts';
import { useMoodBoard } from '../../../contexts/MoodBoardContext';
import { EmotionId, EmotionName } from '../types/Reaction';
import { PostData } from '../types/Post';

export interface BaseCardProps {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  timestamp: string;
  firstName?: string;
  lastName?: string;
  userType: UserAccountType;
}

export const BaseCard: React.FC<BaseCardProps & { children: React.ReactNode; cardStyle?: React.CSSProperties; isPreview?: boolean }> = ({
  id,
  userId,
  username,
  userAvatar,
  timestamp,
  firstName,
  lastName,
  userType,
  children,
  cardStyle,
  isPreview = false
}) => {
  const { fetchPostWithReactions, updatePostReaction } = useMoodBoard();
  const [postData, setPostData] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPreview) {
      setIsLoading(false);
      return;
    }

    const loadPostData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPostWithReactions(id);
        setPostData(data);
      } catch (err) {
        setError('Failed to load post data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPostData();
  }, [id, fetchPostWithReactions, isPreview]);

  const handleReactionSelect = async (postId: string, emotionId: EmotionId) => {
    try {
      const updatedReactions = await updatePostReaction(postId, emotionId);
      if (postData) {
        setPostData({ ...postData, reactionCounts: updatedReactions });
      }
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error || !postData) {
    return <div>Error loading post</div>;
  }

  return (
    <Card sx={{ 
      borderRadius: 4, 
      boxShadow: 3, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      ...cardStyle,
    }}>
      <CardHeader 
        userId={userId}
        username={username}
        userAvatar={userAvatar}
        timestamp={timestamp}
        firstName={firstName}
        lastName={lastName}
      />
      <CardContent sx={{ flexGrow: 1, p: 0, overflow: 'hidden' }}>
        {children}
      </CardContent>
      <CardFooter 
        postId={id}
        reactions={postData.reactionCounts}
        userTypeBadge={<UserTypeBadge userType={userType as UserAccountTypeEnum} />}
        onReactionSelect={handleReactionSelect}
      />
    </Card>
  );
};
