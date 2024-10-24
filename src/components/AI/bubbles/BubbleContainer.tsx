import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMoodBoard } from '@/contexts/MoodBoardContext';
import { useAuth } from '@/contexts/AuthContext';

const StyledBubbleContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  @media (max-width: 768px) {
    margin: 4px 0;
  }
`;

const Bubble = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  margin: 10px;
  transition: all 0.3s;
  &:hover {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
`;

export interface BubbleType {
  color: string;
  gradient: string;
  boxShadow: string;
}

export interface BubbleContainerProps {
  onBubbleClick: (bubble: BubbleType) => void;
}

export const defaultBubbles: BubbleType[] = [
  { color: '#000000', gradient: 'linear-gradient(180deg, #797979 0%, #242424 100%)', boxShadow: '0px 8px 30px 0px rgba(5, 15, 49, 0.40)' },
  { color: '#5E84E4', gradient: 'linear-gradient(180deg, #67ACFF 0%, #364CCF 100%)', boxShadow: '0px 8px 30px 0px rgba(75, 114, 255, 0.45)' },
  { color: '#8CCC2F', gradient: 'linear-gradient(180deg, #C0EB86 0%, #86B15C 100%)', boxShadow: '0px 8px 30px 0px rgba(22, 156, 0, 0.40)' },
  { color: '#FF730E', gradient: 'linear-gradient(180deg, #FFA480 0%, #FF6C4A 100%)', boxShadow: '0px 8px 30px 0px rgba(255, 108, 74, 0.40)' },
  { color: '#7758E5', gradient: 'linear-gradient(180deg, #9A7DEF 0%, #6F44EC 100%)', boxShadow: '0px 8px 30px 0px rgba(111, 68, 236, 0.40)' },
  { color: '#EB4E3D', gradient: 'linear-gradient(180deg, #FF6577 0%, #FF3636 100%)', boxShadow: '0px 8px 30px 0px rgba(255, 54, 54, 0.40)' },
  { color: '#EFEFEF', gradient: 'linear-gradient(180deg, #FFF 0%, #DDE0E9 100%)', boxShadow: '0px 8px 30px 0px rgba(221, 224, 233, 0.40)' },
  { color: '#F7C422', gradient: 'linear-gradient(180deg, #FFDF7B 0%, #FFA746 100%)', boxShadow: '0px 8px 30px 0px rgba(255, 167, 70, 0.40)' }
];

const BubbleContainer: React.FC<BubbleContainerProps> = ({ onBubbleClick }) => {
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<BubbleType[]>(defaultBubbles);
  const { user } = useAuth();
  const { getEmotionMappings, isLoading, error } = useMoodBoard();

  useEffect(() => {
    const fetchUserEmotions = async () => {
      if (user) {
        try {
          const userEmotions = await getEmotionMappings(user.userId);
          if (userEmotions.length > 0) {
            const userBubbles = userEmotions.map(emotion => ({
              color: emotion.color,
              gradient: 'gradient' in emotion ? emotion.gradient as string : `linear-gradient(180deg, ${emotion.color} 0%, ${emotion.color} 100%)`,
              boxShadow: 'boxShadow' in emotion ? emotion.boxShadow as string : '0px 8px 30px 0px rgba(0, 0, 0, 0.40)'
            }));
            setBubbles(userBubbles);
          }
        } catch (err) {
          console.error('Error loading custom emotion colors', err);
        }
      }
    };

    fetchUserEmotions();
  }, [user, getEmotionMappings]);

  const handleBubbleClick = (bubble: BubbleType) => {
    setSelectedBubble(bubble.gradient);
    onBubbleClick(bubble);
  };

  if (isLoading) {
    return <div>Loading bubbles...</div>;
  }

  if (error) {
    console.error('Error in BubbleContainer', error);
    return <div>Error loading bubbles. Please try again.</div>;
  }

  return (
    <StyledBubbleContainer>
      {bubbles.map((bubble) => (
        <Bubble
          key={bubble.color}
          style={{
            background: bubble.gradient,
            boxShadow: selectedBubble === bubble.gradient
              ? '0 0 10px rgba(255, 255, 255, 0.5)'
              : bubble.boxShadow,
          }}
          onClick={() => handleBubbleClick(bubble)}
        />
      ))}
    </StyledBubbleContainer>
  );
};

export default BubbleContainer;
