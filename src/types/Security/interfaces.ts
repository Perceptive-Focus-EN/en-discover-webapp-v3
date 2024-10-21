import { TwoFactorAuthConfig, TwoFactorAuthMethod, VisibilityConfig } from './types';

export interface LoginSecurity {
  alerts: boolean;
  lastLogin: string;
  failedAttempts: number;
  lockoutUntil?: string;
  lockout: boolean;
  lockoutThreshold: number;
  lockoutDuration: number;
}

export interface TwoFactorAuthentication {
  enabled: TwoFactorAuthConfig;
  preferredMethod: TwoFactorAuthMethod;
  backupCodes: string[];
}

export interface PrivacySettings {
  dataSharing: boolean;
  activityTracking: boolean;
  visibility: VisibilityConfig;
}

export interface SecuritySettings {
  login: LoginSecurity;
  twoFactor: TwoFactorAuthentication;
  passwordLastChanged: string;
  securityQuestions: string[];
}

export interface SecurityAndPrivacyConfig {
  security: SecuritySettings;
  privacy: PrivacySettings;
}