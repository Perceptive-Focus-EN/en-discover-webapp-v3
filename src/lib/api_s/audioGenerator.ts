// src/lib/api_s/audioGenerator.ts
import axios from 'axios';

interface SynthesizeSpeechParams {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export const synthesizeSpeech = async ({ text, voice = 'onyx' }: SynthesizeSpeechParams): Promise<string> => {
  try {
    const response = await axios.post('/api/tts', { text, voice }, { responseType: 'blob' });

    if (response.status === 200) {
      const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`An error occurred: ${error.message}`);
    } else {
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
};