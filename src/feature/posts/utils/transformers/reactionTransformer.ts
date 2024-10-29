import { Reaction, ReactionResponse } from "@/feature/types/Reaction";

// src/features/posts/utils/transformers/reactionTransformer.ts
export const transformReactionResponse = (response: ReactionResponse): Reaction => {
  const { data } = response;
  return {
    id: data.id,
    postId: data.postId,
    userId: data.userId,
    tenantId: data.tenantId,
    emotionId: data.emotionId,
    name: data.name,
    color: data.color,
    count: data.count,
    user: data.user,
    createdAt: data.createdAt
  };
};