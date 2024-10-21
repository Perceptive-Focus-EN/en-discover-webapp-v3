// types/settings/index.ts

import { UploadRequest } from '../requests/UploadRequest';

// Core settings interfaces
export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface PrivateSettings {
  security: SecuritySettings;
  privacy: PrivacySettings;
}

export interface StyleSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  font: string;
  fontSize: number;
  colorScheme: string;
}

export interface OverseerInviteSettings {
  pendingInvites: InviteInfo[];
  inviteHistory: InviteHistoryItem[];
}

export interface TenantSpecificSettings {
  roles: RoleSettings[];
  resourceAllocation: ResourceAllocation;
}

export interface ApiAccessSettings {
  apiKeys: ApiKeyInfo[];
  permissions: string[];
}

// Main settings state interface
export interface SettingsState {
  id: string;
  userId: string;
  tenantId: string;
  avatarUrl: string;
  notifications: NotificationSettings;
  private: PrivateSettings;
  style: StyleSettings;
  overseerInvites: OverseerInviteSettings;
  tenantInfo: TenantSpecificSettings;
  apiAccess: ApiAccessSettings;
  faq: FaqSettings;
  appRating: AppRatingSettings;
  terms: TermsSettings;
  privacyPolicy: PrivacyPolicySettings;
  isLoading: boolean;
  error: string | null;
}

// Additional settings interfaces
export interface FaqSettings {
  questions: FaqItem[];
  lastUpdated: Date;
}

export interface AppRatingSettings {
  currentRating: number;
  feedbackHistory: FeedbackItem[];
}

export interface TermsSettings {
  version: string;
  lastAccepted: Date;
  content: string;
}

export interface PrivacyPolicySettings {
  version: string;
  lastAccepted: Date;
  content: string;
}

// Sub-component interfaces
interface SecuritySettings {
  twoFactorAuthEnabled: boolean;
  passwordLastChanged: Date;
  activeSessions: SessionInfo[];
}

interface PrivacySettings {
  dataSharing: boolean;
  activityTracking: boolean;
  visibility: {
    profile: VisibilityLevel;
    email: VisibilityLevel;
    phone: VisibilityLevel;
    location: VisibilityLevel;
    age: VisibilityLevel;
    dob: VisibilityLevel;
  };
}

interface ResourceAllocation {
  storageLimit: number; // in GB
  apiUsageLimit: number; // requests per month
}

// Utility types
export type VisibilityLevel = 'public' | 'private' | 'tenant-only';
export type InviteStatus = 'accepted' | 'declined' | 'expired';

// Reusable interfaces
export interface InviteInfo {
  email: string;
  role: string;
  invitedAt: Date;
}

export interface InviteHistoryItem extends InviteInfo {
  status: InviteStatus;
  date: Date;
}

export interface RoleSettings {
  role: string;
  settings: any; // Consider defining a more specific type if possible
}

export interface ApiKeyInfo {
  key: string;
  name: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface SessionInfo {
  sessionId: string;
  device: string;
  lastActive: Date;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FeedbackItem {
  rating: number;
  feedback: string;
  date: Date;
}