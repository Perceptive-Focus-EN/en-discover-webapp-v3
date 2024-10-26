import { AllRoles } from "@/constants/AccessKey/AccountRoles";
import { UserAccountTypeEnum } from "@/constants/AccessKey/accounts";

export interface MessagingContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: DirectMessage[];
  unreadCount: number;
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, attachment?: File) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  startNewConversation: (userId: string) => Promise<string>;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface MessagingDrawerProps {
  open: boolean;
  onClose: () => void;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  tenantId: string;
  sender: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: AllRoles;
    accountType: UserAccountTypeEnum;
  };
}

export interface Conversation {
  id: string;
  tenantId: string;
  participants: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: AllRoles;
    accountType: UserAccountTypeEnum;
  }>;
  lastMessage?: DirectMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}
