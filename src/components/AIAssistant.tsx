import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import CircleButton from './AI/CircleButton';
import PromptInput from './AI/PromptInput';
import TextOutput from './AI/TextOutput';
import BubbleContainer, { BubbleType } from './AI/bubbles/BubbleContainer';
import VoiceSelector from './AI/VoiceSelector';
import useClickOutside from '../hooks/useClickOutside';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import generateResponseGenerator from '../lib/api_s/responseGenerator';
import { audioApi } from '@/lib/api_s/audioGenerator';

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const ChitChatButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  background: #f0f0f0;
  border: 2px solid #ddd;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #e9e9e9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CombinedSelector = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 400px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 1000;
  opacity: 0.95;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
`;

const AIAssistant: React.FC = () => {
  const { state, dispatch } = useAIAssistant();
  const combinedSelectorRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Cleanup audio URL when component unmounts or audio URL changes
  useEffect(() => {
    return () => {
      if (state.audioUrl) {
        audioApi.revokeAudioUrl(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  useEffect(() => {
    console.info('AI Assistant initialized', { initialVoice: state.selectedVoice });
  }, [state.selectedVoice]);

  useEffect(() => {
    if (transcript) {
      handlePromptSubmit(transcript);
      resetTranscript();
    }
  }, [transcript]);

  const closeCombinedSelector = () => {
    dispatch({ type: 'SET_SHOW_COMBINED_SELECTOR', payload: false });
    console.debug('Combined selector closed', { description: 'Options panel closed' });
  };
  
  useClickOutside(combinedSelectorRef, closeCombinedSelector);

  const handleBubbleClick = (bubbleInfo: BubbleType) => {
    dispatch({ type: 'SET_BUTTON_COLOR', payload: bubbleInfo.color as "blue" | "green" | "red" | "purple" | "yellow" });
    dispatch({ type: 'SET_BUTTON_GRADIENT', payload: bubbleInfo.gradient });
    dispatch({ type: 'SET_SELECTED_BOX_SHADOW', payload: bubbleInfo.boxShadow });
    console.info('Bubble style selected', { bubbleInfo });
  };

  const handlePromptSubmit = async (input: string) => {
    try {
      setIsLoading(true);
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      
      // Generate text response
      const response = await generateResponseGenerator({ userInput: input, context });
      dispatch({ type: 'SET_GENERATED_RESPONSE', payload: response });
      setContext(prevContext => [...prevContext, `User: ${input}`, `Assistant: ${response}`]);
      
      // Synthesize speech with new audioApi
      dispatch({ type: 'SET_IS_SYNTHESIZING', payload: true });
      
      // Clean up previous audio URL if it exists
      if (state.audioUrl) {
        audioApi.revokeAudioUrl(state.audioUrl);
      }

      const audioUrl = await audioApi.synthesizeSpeech({
        text: response,
        voice: state.selectedVoice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
      });
      
      dispatch({ type: 'SET_AUDIO_URL', payload: audioUrl });
      console.info('Response generated and synthesized', { 
        responseLength: response.length, 
        audioUrl,
        voice: state.selectedVoice 
      });
    } catch (error) {
      console.error('Error in generating or synthesizing response', { error });
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  };
  
  const handleSynthesisComplete = () => {
    dispatch({ type: 'SET_IS_SYNTHESIZING', payload: false });
    console.info('Speech synthesis completed', { voiceUsed: state.selectedVoice });
  };

  const handleLongPress = () => {
    dispatch({ type: 'SET_SHOW_COMBINED_SELECTOR', payload: true });
    console.debug('Long press detected', { description: 'Options panel opened' });
  };

  const handleChitChatToggle = () => {
    const newShowInput = !state.showInput;
    dispatch({ type: 'SET_SHOW_INPUT', payload: newShowInput });
    if (newShowInput && browserSupportsSpeechRecognition) {
      SpeechRecognition.startListening({ continuous: true });
    } else {
      SpeechRecognition.stopListening();
    }
    console.info(`Chit Chat ${newShowInput ? 'enabled' : 'disabled'}`, { 
      showInput: newShowInput, 
      speechRecognitionEnabled: newShowInput 
    });
  };

  return (
    <AssistantContainer>
      <CircleButton
        onSynthesisComplete={handleSynthesisComplete}
        onLongPress={handleLongPress}
      />
      {state.showInput && (
        <PromptInput
          onGenerateResponse={handlePromptSubmit}
          selectedBubble={state.selectedBubble}
          microphoneColor={state.buttonColor}
          isRecording={listening}
        />
      )}
      <ChitChatButton onClick={handleChitChatToggle}>
        {state.showInput ? 'End Chat' : 'Chit Chat'}
      </ChitChatButton>
      <TextOutput text={state.generatedResponse} />

      {state.showCombinedSelector && (
        <CombinedSelector ref={combinedSelectorRef}>
          <BubbleContainer onBubbleClick={handleBubbleClick} />
          <VoiceSelector />
        </CombinedSelector>
      )}
    </AssistantContainer>
  );
};

export default AIAssistant;