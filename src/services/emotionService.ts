// src/services/emotionService.ts
import { EmotionName } from '../components/Feed/types/Reaction';
import { VolumeLevelId } from '../components/EN/constants/volume';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { Emotion } from '@/components/EN/types/emotions';
import mockEmotions from '@/components/EN/mockEmotions';
import { 
  getMappings, 
  getMappingById, 
  addMapping, 
  updateMapping, 
  deleteMapping,
  mockUserId 
} from '@/pages/api/mockEmotionColorMappings';

export const emotionService = {
  getEmotions: async (
    userId: string, 
    timeRange: TimeRange, 
    filters?: {
      emotionName: EmotionName | null,
      volume: VolumeLevelId | null,
      source: string | null
    }
  ): Promise<Emotion[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    // Filter emotions for the current user
    let filteredEmotions = mockEmotions.filter(emotion => emotion.userId === userId);

    if (filters) {
      filteredEmotions = filteredEmotions.filter(emotion => {
        if (filters.emotionName !== null && emotion.emotionName !== filters.emotionName) return false;
        if (filters.volume !== null && emotion.volume !== filters.volume) return false;
        if (filters.source !== null && !emotion.sources.includes(filters.source)) return false;
        return true;
      });
    }

    // Apply time range filter
    if (timeRange !== 'lifetime') {
      const now = new Date();
      const timeRangeInDays = timeRange === 'day' ? 1 : 
                              timeRange === 'week' ? 7 : 
                              timeRange === 'month' ? 30 : 365;
      filteredEmotions = filteredEmotions.filter(emotion => 
        emotion.timestamp && (now.getTime() - emotion.timestamp.getTime()) / (1000 * 3600 * 24) <= timeRangeInDays
      );
    }

    // Get color mappings for the current user
    const userColorMappings = getMappings().filter(mapping => mapping.userId === userId);

    // Create a color mapping object
    const colorMappings = userColorMappings.reduce((acc, mapping) => {
      acc[mapping.emotionName] = mapping.color;
      return acc;
    }, {} as Record<EmotionName, string>);

    // Apply color mappings to filtered emotions
    const emotionsWithMappedColors = filteredEmotions.map(emotion => ({
      ...emotion,
      color: colorMappings[emotion.emotionName] || emotion.color // Use mapped color if available, otherwise keep original
    }));

    return emotionsWithMappedColors;
  },

  getEmotionColorMappings: async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    return getMappings().filter(mapping => mapping.userId === userId);
  },

  addEmotionColorMapping: async (mapping: Omit<EmotionColorMapping, 'id' | 'createdAt' | 'updatedAt'>) => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    return addMapping(mapping);
  },

  updateEmotionColorMapping: async (id: number, update: Partial<EmotionColorMapping>) => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    return updateMapping(id, update);
  },

  deleteEmotionColorMapping: async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    return deleteMapping(id);
  }
};