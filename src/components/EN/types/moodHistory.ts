// src/types/moodHistory.ts

import { SourceCategoryId, SOURCE_CATEGORIES } from '../constants/sources';
import { VolumeLevelId, VOLUME_LEVELS } from '../constants/volume';
import { Emotion } from './emotions';
import { EmotionName, EmotionId } from '../constants/emotionsAndCategories';


export type TimeRange = 'day' | 'week' | 'month' | 'year' | 'lifetime';


export interface MoodEntry {
  // just using _id as a simulation of what the datbase will have whichw ill be be genereate uniquely automaticlaly by database
  // _id: string;
  // This is the app level id and it will be used internally for app request to database _id is direct query to database will be und
  userId: string;
  // A user can be a part of different tenant, but in the frontend the user will automatically swtich between tenants if they change
  // User will be able to access dfferent teant info based on the teantn theya re current in . frontend just fetches currecnt tenant
  // this can be found under "Tenant" collection with tenantId as the shard key
  tenantId: string;
  // this comes with emotionName but the set is connected to Id under id is the emotionName and date. 
  emotionId: EmotionId;
  // This is necessary to keep track of colors attached to a feeling to measure consistencies and relationship/association.
  color: string; // Add the missing color property
  // Will be number and converted on frontend like mapping. Applciationg is wrapped with converter. 
  volume: VolumeLevelId;
  // debating making this category then sourceId
  sources: SourceCategoryId[];
  // just the date it was made
  date: string;
  timeStamp: string;
  createdAt: string;
  updatedAt: string;
}


// src/components/EN/types/moodHistory.ts
export interface MoodHistoryItem{
  userId: string;
  tenantId: string;
  emotionId: EmotionId;
  emotionName: EmotionName;
  color: string;
  volume: VolumeLevelId;
  sources: SourceCategoryId[];
  date: string;
  timeStamp: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

}

export interface MoodHistoryQuery {
  emotion: Emotion;
  timeRange: TimeRange;
  startDate: string;
  endDate: string;
}

// Helper function to convert source names to IDs when saving a new entry
export function convertSourceNamesToIds(sourceNames: string[]): SourceCategoryId[] {
  return sourceNames.map(name => {
    const category = Object.values(SOURCE_CATEGORIES).find(cat => cat.name === name);
    const defaultCategory = SOURCE_CATEGORIES.find(cat => cat.name === 'Everything');
    if (category) {
      return category.id;
    } else if (defaultCategory) {
      return defaultCategory.id;
    } else {
      throw new Error(`Invalid source name: ${name}`);
    }
  });
}

// Helper function to convert source IDs to names when displaying history
export function convertSourceIdsToNames(sourceIds: SourceCategoryId[]): string[] {
  return sourceIds.map(id => {
    const category = Object.values(SOURCE_CATEGORIES).find(cat => cat.id === id);
    return category ? category.name : 'Unknown';
  });
}