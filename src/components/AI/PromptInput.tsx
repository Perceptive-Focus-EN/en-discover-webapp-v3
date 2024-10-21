import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import RocketIcon from './RocketIcon';
import generateResponseGenerator from '../../lib/api_s/responseGenerator';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

interface PromptInputProps {
  onGenerateResponse: (response: string) => void;
  selectedBubble: string | null;
  isRecording: boolean;
  microphoneColor: string;
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
  border: 2px solid gray;
  border-radius: 5px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const InputField = styled.input`
  flex-grow: 1;
  padding: 12px 15px;
  font-size: 16px;
  border: none;
  border-radius: 5px 0 0 5px;
  color: #333;
  &::placeholder {
    color: #AAA;
  }
`;

const StyledInput = styled(InputField)` // Inherits styles from InputField
  // Additional specific styles for StyledInput if needed
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
`;

const ErrorDisplay = styled.div`
  color: red;
  margin-bottom: 10px;
`;

const SubmitButton = styled.button`
  padding: 0;
  width: 40px;
  height: 40px;
  background-color: transparent;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;

  &:active {
    filter: brightness(0.9);
  }

  svg {
    fill: #333;
    width: 30px;
    height: 30px;
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.2);
    }
  }
`;

const MicrophoneButton = styled.button<PromptInputProps>
  `  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s, box-shadow 0.2s;
  outline: none;

svg.microphone-icon {
    fill: ${(props) => props.isRecording ? props.microphoneColor : 'gray'};
    width: 24px;
    height: 24px;
    transition: fill 0.3s ease;
  }


  &:hover {
    background-color: ${(props) => (props.isRecording ? 'transparent' : '#eee')};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const PromptInput: React.FC<PromptInputProps> = ({ onGenerateResponse, microphoneColor }) => {
  const { transcript, resetTranscript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string>('');
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(Date.now());
  const [isResponding, setIsResponding] = useState(false);
  const [context, setContext] = useState<string[]>([]);
  const { dispatch } = useAIAssistant();

  const PAUSE_DURATION = 2000; // 2 seconds pause before responding

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;

    setError('');
    setIsResponding(true);
    dispatch({ type: 'SET_IS_LOADING', payload: true });
    try {
      const response = await generateResponseGenerator({ userInput: inputText, context });
      onGenerateResponse(response);
      setContext(prevContext => [...prevContext, `User: ${inputText}`, `Assistant: ${response}`]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      resetTranscript();
      setInputText('');
      setIsResponding(false);
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  }, [inputText, onGenerateResponse, resetTranscript, context, dispatch]);
  
  useEffect(() => {
    setInputText(transcript);
    setLastSpeechTime(Date.now());
  }, [transcript]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (listening && Date.now() - lastSpeechTime > PAUSE_DURATION && !isResponding) {
        handleSubmit();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [listening, lastSpeechTime, isResponding, handleSubmit]);

  useEffect(() => {
    if (inputText.length > 0) {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
    } else {
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  }, [inputText, dispatch]);


  if (!browserSupportsSpeechRecognition) {
    return <div>Browser doesn't support speech recognition.</div>;
  }

  const handleMicrophoneClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <InputContainer>
      <StyledInput
        type="text"
        value={inputText}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Type your prompt here"
        aria-label="Input for speech or text"
      />
      <ButtonContainer>
        <SubmitButton onClick={() => handleSubmit()} aria-label="Submit input" disabled={isResponding}>
          <RocketIcon />
        </SubmitButton>
        <MicrophoneButton
          onClick={handleMicrophoneClick}
          isRecording={listening}
          aria-label={listening ? "Microphone on" : "Microphone off"}
          microphoneColor={microphoneColor}
          onGenerateResponse={onGenerateResponse}
          selectedBubble={null}
        >
          {listening ? (
            <FaMicrophone size={24} className="microphone-icon" />
          ) : (
            <FaMicrophoneSlash size={24} fill="gray" />
          )}
        </MicrophoneButton>
      </ButtonContainer>
      {error && <ErrorDisplay>{error}</ErrorDisplay>}
    </InputContainer>
  );
};

export default PromptInput;