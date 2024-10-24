// src/lib/api_s/audioGenerator.ts
import axiosInstance from '../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface SynthesizeSpeechParams {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export const audioApi = {
  synthesizeSpeech: async ({ text, voice = 'onyx' }: SynthesizeSpeechParams): Promise<string> => {
    // Show processing message
    messageHandler.info('Generating audio...');
    
    const response = await axiosInstance.post('/api/tts', 
      { text, voice }, 
      { responseType: 'blob' }
    );

    const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    messageHandler.success('Audio generated successfully');
    return audioUrl;
  },

  // Add method to clean up URLs when needed
  revokeAudioUrl: (url: string): void => {
    URL.revokeObjectURL(url);
  }
};

// Usage example:
/*
try {
  const audioUrl = await audioApi.synthesizeSpeech({ 
    text: 'Hello world', 
    voice: 'onyx' 
  });
  
  // Use the audio URL
  audioPlayer.src = audioUrl;
  
  // Clean up when done
  audioApi.revokeAudioUrl(audioUrl);
} catch (error) {
  // Error already handled by axiosInstance
  // Just handle UI updates if needed
}
*/