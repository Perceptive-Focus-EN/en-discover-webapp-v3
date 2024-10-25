// src/lib/api_s/audioGenerator.ts
import { api } from '../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

interface SynthesizeSpeechParams {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

interface AudioResponse {
  data: Blob;
}

export const audioApi = {
  synthesizeSpeech: async ({ text, voice = 'onyx' }: SynthesizeSpeechParams): Promise<string> => {
    const startTime = Date.now();
    messageHandler.info('Generating audio...');
    
    try {
      const response = await api.post<AudioResponse>(
        '/api/tts',
        { text, voice },
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'audio/mp3'
          }
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'audio',
        'generation_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          textLength: text.length,
          voice
        }
      );
      
      messageHandler.success('Audio generated successfully');
      return audioUrl;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'audio',
        'generation_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          error: error instanceof Error ? error.message : 'unknown',
          voice,
          textLength: text.length
        }
      );
      throw error;
    }
  },

  revokeAudioUrl: (url: string): void => {
    URL.revokeObjectURL(url);
  }
};

