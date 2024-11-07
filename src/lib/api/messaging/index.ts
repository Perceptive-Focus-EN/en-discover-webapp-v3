// src/lib/api_s/messaging/index.ts
import { api } from '../../axiosSetup';
import { DirectMessage, Conversation } from '@/components/Messaging/types/messaging';

export const messagingApi = {
  getConversations: async (tenantId: string): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/api/messaging/conversations', {
      params: { tenantId }
    });
    return response;
  },

  getMessages: async (conversationId: string, tenantId: string): Promise<DirectMessage[]> => {
    const response = await api.get<DirectMessage[]>(`/api/messaging/${conversationId}/messages`, {
      params: { tenantId }
    });
    return response;
  },

  createConversation: async (participantId: string, tenantId: string): Promise<Conversation> => {
    const response = await api.post<Conversation>('/api/messaging/conversations', {
      participantId,
      tenantId
    });
    return response;
  },

  markAsRead: async (conversationId: string, tenantId: string): Promise<void> => {
    await api.put<void>(`/api/messaging/${conversationId}/read`, { tenantId });
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    tenantId: string,
    attachment?: File
  ): Promise<DirectMessage> => {
    let attachmentUrl = '';
    
    if (attachment) {
      const formData = new FormData();
      formData.append('file', attachment);
      const uploadResponse = await api.post<{ url: string }>('/api/messaging/upload', formData);
      attachmentUrl = uploadResponse.url;
    }

    const response = await api.post<DirectMessage>(`/api/messaging/${conversationId}/messages`, {
      content,
      attachmentUrl,
      tenantId
    });
    return response;
  }
};