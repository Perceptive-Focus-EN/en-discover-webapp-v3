// src/utils/settingsPlugins.ts
import React from 'react';
import { Settings } from '../interfaces/ISettings';

type SettingsPlugin = {
  name: string;
  component: React.ComponentType<{
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  }>;
};

const settingsPlugins: SettingsPlugin[] = [];

export const registerSettingsPlugin = (plugin: SettingsPlugin) => {
  settingsPlugins.push(plugin);
};

export const getSettingsPlugins = () => settingsPlugins;