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

// New interface for advanced metrics
export interface ReactionMetrics {
  totalReactions: number;
  averageEngagementRate: number;
  peakReactionTime: Date;
  reactionDistribution: Record<EmotionName, number>;
  reactionVelocity ?: number;  // New metric
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

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  tenantId: string;
  emotionId: EmotionId;
  name: EmotionName;
  color: string;
  count: number;
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

export interface ReactionSummary {
  type: EmotionName;
  count: number;
  hasReacted: boolean;
  recentUsers: Array<{ id: string; name: string; avatarUrl?: string }>;
}

// src/features/posts/api/reactionApi.ts
export interface ReactionResponse {
  data: Reaction;
  message: string;
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
 
