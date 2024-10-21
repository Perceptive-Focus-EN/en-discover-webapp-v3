import React, { useCallback, useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { frontendLogger } from '@/utils/ErrorHandling/frontendLogger';
import LoadingIndicator from './LoadingIndicator';

interface StyledButtonProps {
  isPlaying: boolean;
  gradient: string;
  boxShadow: string;
}

interface CircleButtonProps {
  onSynthesisComplete: () => void;
  onLongPress: () => void;
}

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const speakAnimation = keyframes`
  0%, 100% { transform: scale(1, 1); }
  20%, 80% { transform: scale(1, 0.85); }
`;

const StyledButton = styled.button<StyledButtonProps>`
  width: 20vw;
  height: 20vw;
  max-width: 300px;
  max-height: 300px;
  min-width: 275px;
  min-height: 275px;
  border-radius: 500px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  box-shadow: ${({ boxShadow }) => boxShadow};
  background: ${({ gradient }) => gradient};
  transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  outline: none;
  animation: ${({ isPlaying }) =>
    isPlaying
      ? css`${speakAnimation} 0.5s linear infinite`
      : css`${floatAnimation} 8s ease-in-out infinite`};
  animation-play-state: running;

  &:hover {
    color: #fff;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
  }

  &:active {
    transform: scale(0.92);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15), 0 3px 3px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    width: 35vw;
    height: 35vw;
    max-width: 275px;
    max-height: 275px;
  }
  
  @media (max-width: 480px) {
    width: 50vw;
    height: 50vw;
    max-width: 275px;
    max-height: 275px;
  }
`;

const CircleButtonWrapper = styled.div`
  position: relative;
  width: 20vw;
  height: 20vw;
  max-width: 300px;
  max-height: 300px;
  min-width: 275px;
  min-height: 275px;

  @media (max-width: 768px) {
    width: 35vw;
    height: 35vw;
    max-width: 275px;
    max-height: 275px;
  }
  
  @media (max-width: 480px) {
    width: 50vw;
    height: 50vw;
    max-width: 275px;
    max-height: 275px;
  }
`;

const CircleButton: React.FC<CircleButtonProps> = ({ onSynthesisComplete, onLongPress }) => {
  const { state, dispatch } = useAIAssistant();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      onLongPress();
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const toggleAudioPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (state.audioUrl) {
      const audio = new Audio(state.audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        dispatch({ type: 'SET_IS_SYNTHESIZING', payload: false });
        dispatch({ type: 'SET_IS_LOADING', payload: false });
        onSynthesisComplete();
        frontendLogger.info('Speech synthesis completed', 'AI Assistant finished speaking', { voiceUsed: state.selectedVoice });
      };

      audio.onerror = (error) => {
        frontendLogger.error('Error playing audio', 'An error occurred while playing the synthesized speech', { error });
        setIsPlaying(false);
      };

      return () => {
        audioRef.current = null;
      };
    }
  }, [state.audioUrl, state.selectedVoice, dispatch, onSynthesisComplete]);

    return (
    <CircleButtonWrapper>
      <LoadingIndicator />
      <StyledButton
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        isPlaying={isPlaying}
        gradient={state.buttonGradient}
        boxShadow={state.selectedBoxShadow}
        onClick={toggleAudioPlayback}
      />
    </CircleButtonWrapper>
  );
};
export default CircleButton;