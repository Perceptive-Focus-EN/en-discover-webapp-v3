// src/components/Feed/PostCard.tsx

import React from 'react';
import { Card, CardContent } from '@mui/material';
import { CardHeader } from '../CardHeader';
import { CardFooter } from '../CardFooter';
import { PostContent } from '../types/Post';
import { Reaction, EmotionId } from '../types/Reaction';
import { UserAccountTypeEnum } from '../../../constants/AccessKey/accounts';
import { UserTypeBadge } from './PostingUsersBadge';

interface PostCardProps {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  timestamp: string;
  content: PostContent;
  reactions: Reaction[];
  userType: UserAccountTypeEnum;
  onReactionSelect: (postId: string, emotionId: EmotionId) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  userId,
  username,
  userAvatar,
  timestamp,
  content,
  reactions,
  userType,
  onReactionSelect,
}) => {
  return (
    <Card>
      <CardHeader 
        userId={userId}
        username={username}
        userAvatar={userAvatar}
        timestamp={timestamp}
      />
      <CardContent>
        {/* Render post content based on its type */}
      </CardContent>
      <CardFooter 
        postId={id}
        reactions={reactions}
        userTypeBadge={<UserTypeBadge userType={userType} />}
        onReactionSelect={onReactionSelect}
      />
    </Card>
  );
};

export default PostCard;