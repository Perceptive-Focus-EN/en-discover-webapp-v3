import { Card, CardContent, CardHeader, CircularProgress } from "@mui/material";
import { CardFooter } from "../CardFooter";
import { UserTypeBadge } from "./PostingUsersBadge";
import { useEffect, useState } from "react";
import { useMoodBoard } from "@/contexts/MoodBoardContext";
import { EmotionId, ReactionCount } from "../types/Reaction";
import { UserAccountType, UserAccountTypeEnum } from "@/constants/AccessKey/accounts";

export interface BaseCardProps {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  timestamp: string;
  firstName?: string;
  lastName?: string;
  userType: UserAccountType;
  reactionCounts?: { emotionId: EmotionId; count: number }[]; // Make optional
  isNewPost?: boolean; // Add this prop
}


// src/components/Feed/cards/BaseCard.tsx
export const BaseCard: React.FC<BaseCardProps & { 
  children: React.ReactNode; 
  cardStyle?: React.CSSProperties; 
  isPreview?: boolean 
}> = ({
  id,
  userId,
  username,
  userAvatar,
  timestamp,
  firstName = '',
  lastName = '',
  userType,
  children,
  cardStyle,
  isPreview = false,
  reactionCounts = [], // Default empty array
  isNewPost = false
}) => {
  const { fetchPostWithReactions, updatePostReaction } = useMoodBoard();
  const [localReactionCounts, setLocalReactionCounts] = useState(reactionCounts);
  const [isLoading, setIsLoading] = useState(!isPreview && !isNewPost);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPreview || isNewPost) {
      setIsLoading(false);
      return;
    }

    const loadPostData = async () => {
      try {
        const data = await fetchPostWithReactions(id);
        setLocalReactionCounts(data.reactionCounts || []);
      } catch (err) {
        setError('Failed to load post data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPostData();
  }, [id, fetchPostWithReactions, isPreview, isNewPost]);

  const handleReactionSelect = async (postId: string, emotionId: EmotionId) => {
    try {
      if (isNewPost) {
        setLocalReactionCounts((current: ReactionCount[]) => {
          const existing = current.find((r: ReactionCount) => r.emotionId === emotionId);
          if (existing) {
            return current.map((r: ReactionCount) => 
              r.emotionId === emotionId 
          ? { ...r, count: r.count + 1 }
          : r
            );
          }
          return [...current, { emotionId, count: 1 }];
        });
        return;
      }

      const updatedReactions = await updatePostReaction(postId, emotionId);
      setLocalReactionCounts(updatedReactions);
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
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
        reactions={localReactionCounts}
        userTypeBadge={<UserTypeBadge userType={userType as UserAccountTypeEnum} />}
        onReactionSelect={handleReactionSelect}
      />
    </Card>
  );
};