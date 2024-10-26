import { UserAccountTypeEnum } from "../../../constants/AccessKey/accounts";
import { User } from "../../../types/User/interfaces";


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
  { id: 1, emotionName: "EUPHORIC" },
  { id: 2, emotionName: "TRANQUIL" },
  { id: 3, emotionName: "REACTIVE" },
  { id: 4, emotionName: "SORROW" },
  { id: 5, emotionName: "FEAR" },
  { id: 6, emotionName: "DISGUST" },
  { id: 7, emotionName: "SUSPENSE" },
  { id: 8, emotionName: "ENERGY" }
] as const;

export type ReactionType = typeof EmotionType[number];

export interface Reaction {
  id: string;
  color: string;
  name: EmotionName;
  count: number;
  emotionId: EmotionId;
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


export interface SocialReaction extends Reaction {
  user: User;
  reactionType: ReactionType;
  postId: string;
  timestamp: Date;  // Changed from string to Date
  engagementRate?: number;  // New metric
  reactionVelocity?: number;  // New metric
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

export interface SocialReactionResponse {
  success: boolean;
  message: string;
  data: SocialReaction[];
}

// New interface for advanced metrics
export interface ReactionMetrics {
  totalReactions: number;
  averageEngagementRate: number;
  peakReactionTime: Date;
  reactionDistribution: Record<EmotionName, number>;
}