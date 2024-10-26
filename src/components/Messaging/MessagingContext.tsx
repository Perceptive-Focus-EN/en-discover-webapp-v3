// src/contexts/MessagingContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { messagingApi } from '@/lib/api_s/messaging';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { Conversation, DirectMessage, MessagingContextType } from './types/messaging';

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider');
  }
  return context;
};

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentTenant } = useGlobalState();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations when tenant changes
  useEffect(() => {
    if (currentTenant?.tenantId) {
      loadConversations();
    }
  }, [currentTenant?.tenantId]);

  // Calculate unread messages
  useEffect(() => {
    const total = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
    setUnreadCount(total);
  }, [conversations]);

  const loadConversations = async () => {
    if (!user || !currentTenant?.tenantId) return;
    
    setIsLoading(true);
    try {
      const response = await messagingApi.getConversations(currentTenant.tenantId);
      setConversations(response);
    } catch (error) {
      messageHandler.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user || !currentTenant?.tenantId) return;
    
    setIsLoading(true);
    try {
      const response = await messagingApi.getMessages(conversationId, currentTenant.tenantId);
      setMessages(response);
      setActiveConversation(conversationId);
      await markConversationAsRead(conversationId);
    } catch (error) {
      messageHandler.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string, attachment?: File) => {
    if (!user || !currentTenant?.tenantId) return;
    
    try {
      const newMessage = await messagingApi.sendMessage(
        conversationId, 
        content,
        currentTenant.tenantId,
        attachment
      );
      
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                lastMessage: newMessage,
                updatedAt: new Date().toISOString()
              }
            : conv
        )
      );
      
      messageHandler.success('Message sent');
    } catch (error) {
      messageHandler.error('Failed to send message');
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user || !currentTenant?.tenantId) return;
    
    try {
      await messagingApi.markAsRead(conversationId, currentTenant.tenantId);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      setMessages(prev =>
        prev.map(msg =>
          msg.conversationId === conversationId && msg.receiverId === user.userId
            ? { ...msg, read: true }
            : msg
        )
      );
    } catch (error) {
      messageHandler.error('Failed to mark conversation as read');
    }
  };

  const startNewConversation = async (userId: string): Promise<string> => {
    if (!user || !currentTenant?.tenantId) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await messagingApi.createConversation(userId, currentTenant.tenantId);
      setConversations(prev => [response, ...prev]);
      return response.id;
    } catch (error) {
      messageHandler.error('Failed to start conversation');
      throw error;
    }
  };

  return (
    <MessagingContext.Provider value={{
      conversations,
      activeConversation,
      messages,
      unreadCount,
      isLoading,
      loadConversations,
      loadMessages,
      sendMessage,
      markConversationAsRead,
      setActiveConversation,
      startNewConversation
    }}>
      {children}
    </MessagingContext.Provider>
  );
};