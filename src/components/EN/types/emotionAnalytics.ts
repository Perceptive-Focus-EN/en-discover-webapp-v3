// src/components/EN/types/emotionAnalytics.ts



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
  emotionId: number;
  // This is necessary to keep track of colors attached to a feeling to measure consistencies and relationship/association.
  color: string; // Add the missing color property
  // Will be number and converted on frontend like mapping. Applciationg is wrapped with converter. 
  volume: number;
  // debating making this category then sourceId
  sources: number[];
  // just the date it was made
  date: string;
  timeStamp: string;
  createdAt: string;
  updatedAt: string;
}



export interface EmotionFrequency {
  emotionName: string;
  frequency: number;
}

export interface EmotionIntensity {
  emotionId: string;
  avgVolume: number;
}

export interface EmotionTrigger {
  emotionId: string;
  sources: number[];
  frequency: number;
}

export interface EmotionTrend {
  date: string;
  emotionId: string;
  count: number;
}

// Add this new interface
export interface EmotionAnalytics {
  recentEntries: MoodEntry[];
  emotionFrequency: EmotionFrequency[];
  avgVolume: EmotionIntensity[];
  emotionTriggers: EmotionTrigger[];
  emotionTrends: EmotionTrend[];
}