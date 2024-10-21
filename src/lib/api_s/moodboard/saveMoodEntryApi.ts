// src/lib/api_s/moodboard/saveMoodEntryApi.ts
import axiosInstance from '../../axiosSetup';
import { AxiosError } from 'axios';
import { MoodEntry } from '../../../components/EN/types/moodHistory';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';

export async function saveMoodEntry(entry: Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>): Promise<void> {
  frontendLogger.info('Attempting to save mood entry', 'Saving your mood...', { entry });
  
  // Ensure all required fields are present
  if (!entry.emotionId || !entry.color || !entry.volume || !entry.sources || !entry.date || !entry.tenantId) {
    const error = new Error('Missing required fields for mood entry');
    frontendLogger.error(error, 'Unable to save mood entry. Please fill in all required fields.', { entry });
    throw error;
  }

  try {
    const response = await axiosInstance.post('/api/moodboard/saveMoodEntry', entry);
    frontendLogger.info('Mood entry saved successfully', 'Your mood has been saved!', { responseData: response.data });
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        frontendLogger.error(error, 'Authentication failed. Please log in again.', { entry });
        throw new Error('Authentication failed. Please log in again.');
      }
      const errorMessage = error.response?.data?.error || 'An error occurred while saving mood entry.';
      frontendLogger.error(error, errorMessage, { entry });
      throw new Error(errorMessage);
    }
    frontendLogger.error(error as Error, 'An unexpected error occurred while saving mood entry.', { entry });
    throw new Error('An unexpected error occurred while saving mood entry.');
  }
}