export type TwoFactorAuthMethod = 'email' | 'sms' | 'push';
export type VisibilityLevel = 'public' | 'private' | 'tenant-only';
export type ProfileElement = 'profile' | 'contactInfo';

export type TwoFactorAuthConfig = Record<TwoFactorAuthMethod, boolean>;
export type VisibilityConfig = Record<ProfileElement, VisibilityLevel>;