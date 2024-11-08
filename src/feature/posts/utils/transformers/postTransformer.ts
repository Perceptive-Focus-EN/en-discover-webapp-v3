// src/utils/transformers/postTransformer.ts
import { Post } from '../../api/types';

export const transformDbPostToApi = (dbPost: any): Post => ({
  id: dbPost._id.toString(),
  userId: dbPost.userId,
  username: dbPost.username,
  userAvatar: dbPost.userAvatar,
  type: dbPost.type,
  content: dbPost.content,
  media: dbPost.media,
  reactions: dbPost.reactions || [],
  commentCount: dbPost.commentCount || 0,
  authorId: dbPost.authorId,
  timestamp: dbPost.timestamp,
  accountType: dbPost.userAccountType,
  createdAt: dbPost.createdAt,
  updatedAt: dbPost.updatedAt,
  status: dbPost.status,
  visibility: dbPost.visibility,
  isEdited: dbPost.isEdited || false,
  lastEditedAt: dbPost.lastEditedAt,
  metadata: dbPost.metadata,
  tenantId: dbPost.tenantId
});