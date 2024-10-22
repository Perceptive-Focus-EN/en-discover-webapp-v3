import React, { useState, useCallback, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { synthesizeSpeech } from '../../utils/audioGenerator';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

type VoiceMappingType = {
  Chill: 'onyx';
  Lively: 'alloy';
  Posh: 'fable';
  Whisper: 'nova';
  Echo: 'echo';
  Shimmer: 'shimmer';
  // Add other possible voice names here
};

const voiceMapping: VoiceMappingType = {
  Chill: 'onyx',
  Lively: 'alloy',
  Posh: 'fable',
  Whisper: 'nova',
  Echo: 'echo',
  Shimmer: 'shimmer'
};

const VoiceSelector: React.FC = () => {
  const voiceOptions = Object.keys(voiceMapping) as (keyof VoiceMappingType)[];
  const [selectedDisplayName, setSelectedDisplayName] = useState<keyof VoiceMappingType>('Chill');
  const theme = useTheme();
  const { dispatch } = useAIAssistant();

  // Handle voice selection logic
  const handleVoiceSelect = useCallback(
    async (displayName: keyof VoiceMappingType) => {
      setSelectedDisplayName(displayName);
      const actualVoiceName = voiceMapping[displayName];
      dispatch({ type: 'SET_SELECTED_VOICE', payload: actualVoiceName });
      try {
        const audioUrl = await synthesizeSpeech('Choose me please', actualVoiceName);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (error) {
        console.error('Error synthesizing and playing speech:', error);
        alert('There was an error playing the selected voice. Please try again.');
      }
    },
    [dispatch]
  );

  // Ensure the selected voice is announced to screen readers
  useEffect(() => {
    const selectedVoiceElement = document.querySelector('[aria-selected="true"]');
    if (selectedVoiceElement) {
      (selectedVoiceElement as HTMLElement).focus();
    }
  }, [selectedDisplayName]);

  return (
    <Box
      role="tablist"
      aria-label="Voice Selector"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '2px 4px', // Adjusted padding
        backdropFilter: 'blur(10px)',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 30,
        boxShadow: theme.shadows[4],
        width: '100%',
        maxWidth: 600,
        height: 70,
      }}
    >
      {voiceOptions.map((displayName) => (
        <Box
          key={displayName}
          role="tab"
          aria-selected={selectedDisplayName === displayName}
          tabIndex={selectedDisplayName === displayName ? 0 : -1}
          title={displayName}
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            paddingX: 3,
            marginX: 0.5,
            color: selectedDisplayName === displayName
              ? 'transparent'
              : theme.palette.text.secondary,
            zIndex: 2,
            transition: 'color 0.3s ease',
          }}
          onClick={() => handleVoiceSelect(displayName)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleVoiceSelect(displayName);
            }
          }}
        >
          {displayName}
        </Box>
      ))}

      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${100 / voiceOptions.length}%`,
          height: '80%',
          backgroundColor: theme.palette.primary.main,
          borderRadius: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          left: `${(voiceOptions.indexOf(selectedDisplayName) * 100) / voiceOptions.length}%`,
          color: theme.palette.primary.contrastText,
          zIndex: 1,
          paddingX: 3,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          fontSize: '0.9rem',
        }}
      >
        {selectedDisplayName}
      </Box>
    </Box>
  );
};

export default React.memo(VoiceSelector);
