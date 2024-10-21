// src/interfaces/ISettings.ts

// Define ThemeType internally
export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

import { 
  LanguageType, 
  CurrencyType, 
  MeasurementSystemType, 
  TemperaturaUnitType, 
  TimeFormatType, 
  DateFormatType, 
  TimeZoneType, 
  CountryType 
} from '../types/Shared/types';
import {  ROLES } from '../constants/AccessKey/AccountRoles';

import { 
  LayoutType 
} from '../types/Shared/interfaces';

import { 
  User 
} from '../types/User/interfaces';

import { 
  NotificationSettings 
} from '../types/Notification/interfaces';

import { 
  PrivacySettings, 
  SecuritySettings 
} from '../types/Security/interfaces';

// User contact information
export interface UserContactInfo {
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: CountryType;
  email: string;
}

// User preferences
export interface UserPreferences {
  language: LanguageType;
  theme: ThemeType;
  dashboardLayout: LayoutType;
  timeZone: TimeZoneType;
  dateFormat: DateFormatType;
  timeFormat: TimeFormatType;
  currency: CurrencyType;
  temperatureUnit: TemperaturaUnitType; 
  measurementSystem: MeasurementSystemType;
}

// User settings
export interface UserSettings extends User {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: keyof typeof ROLES;
  contactInfo: UserContactInfo;
  notifications: NotificationSettings; 
  security: SecuritySettings;
  preferences: UserPreferences;
  privacy: PrivacySettings;
  department: string;
  lastLogin: string;
}

// Main settings interface encompassing all personal settings
export interface Settings {
  id: string;
  userId: string;
  user: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Export any utility types or functions related to settings here
export type PartialSettings = Partial<Settings>;
export type SettingsUpdatePayload = Omit<Partial<Settings>, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
