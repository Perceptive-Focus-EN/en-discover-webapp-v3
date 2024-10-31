export type EmotionName = 'EUPHORIC' | 'TRANQUIL' | 'REACTIVE' | 'SORROW' | 'FEAR' | 'DISGUST' | 'SUSPENSE' | 'ENERGY';

export type EmotionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const EmotionIdMap: Record<EmotionName, EmotionId> = {
  EUPHORIC: 1,
  TRANQUIL: 2,
  REACTIVE: 3,
  SORROW: 4,
  FEAR: 5,
  DISGUST: 6,
  SUSPENSE: 7,
  ENERGY: 8
};


export const EmotionType = [
  { id: 1 as EmotionId, emotionName: "EUPHORIC" as EmotionName },
  { id: 2 as EmotionId, emotionName: "TRANQUIL" as EmotionName },
  { id: 3 as EmotionId, emotionName: "REACTIVE" as EmotionName },
  { id: 4 as EmotionId, emotionName: "SORROW" as EmotionName },
  { id: 5 as EmotionId, emotionName: "FEAR" as EmotionName },
  { id: 6 as EmotionId, emotionName: "DISGUST" as EmotionName },
  { id: 7 as EmotionId, emotionName: "SUSPENSE" as EmotionName },
  { id: 8 as EmotionId, emotionName: "ENERGY" as EmotionName }
] as const;

export type ReactionType = typeof EmotionType[number];


// New interface for advanced metrics
export interface ReactionMetrics {
  totalReactions: number;
  averageEngagementRate: number;
  peakReactionTime: Date;
  reactionDistribution: Record<EmotionName, number>;
  reactionVelocity ?: number;  // New metric
  recentReactions: Array<{
  emotionName: EmotionName;
  user: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
    timestamp: string;
  }>;
}

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  tenantId: string;
  emotionId: EmotionId;
  emotionName: EmotionName;
  color: string;
  count: ReactionCount
  user?: {
    id: string;
    name: {
        firstName: string;
        lastName: string;
    }
    avatarUrl?: string;
  };
createdAt: string;
}


export interface ReactionCount {
  count: number;
  emotionId: EmotionId; // Add the emotionId property
}

export interface ReactionCountResponse {
  success: boolean;
  message: string;
  data: ReactionCount[];
}



export interface ReactionSummary {
  type: EmotionName;
  count: number;
  color: string;
  hasReacted: boolean;
  recentUsers: Array<{ id: string; name: string; avatarUrl?: string }>;
}

// src/features/posts/api/reactionApi.ts
export interface ReactionResponse {
  data: {
    id: string;
    postId: string;
    userId: string;
    tenantId: string;
    emotionId: EmotionId;
    name: EmotionName;
    color: string;
    count: number;
    createdAt: string;
    user?: {
      id: string;
      name: {
        firstName: string;
        lastName: string;
      }
      avatarUrl?: string;
    };
  };
  message?: string;
}

// hypothetical:
  // {
  // _id: ObjectId("1234567890");  // New field
  // reactionId: generateUniqueId();  // New field
  // userId: '1234567890';
  // color: <rbg color code >
    // emotionName: 'EUPHORIC'
  // count: 10
  // emotionId: 1
  // postId: [
    // '1234567890',
    // '0987654321',
    // '1234567890',
    // '0987654321',
    // '1234567890',
    // '0987654321',
    // '1234567890',
    // '0987654321',
    // '1234567890',
    // '0987654321'
  // ]
// }
//
 
