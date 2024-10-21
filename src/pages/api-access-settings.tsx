import React from 'react';
import ApiAccessSettings from '../components/Settings/ApiAccessSettings';
import { ApiAccessSettingsType } from '../components/Settings/ApiAccessSettings';

interface ApiKeyInfo {
    key: string;
    createdAt: string;
    name: string;
    lastUsed: string;
}

interface Settings {
    apiKey: string;
    accessLevel: string;
    apiKeys: ApiKeyInfo[];
    permissions: string[];
}

const ApiAccessSettingsPage: React.FC = () => {
    const initialSettings: Settings = {
        apiKey: '',
        accessLevel: '',
        apiKeys: [],
        permissions: []
    };

    return (
        <ApiAccessSettings
            settings={initialSettings}
            onUpdate={(newSettings: ApiAccessSettingsType) => {
                console.log(newSettings);
            }}
        />
    );
};

export default ApiAccessSettingsPage;
