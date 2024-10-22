import React from 'react';
import ApiAccessSettings from '../components/Settings/ApiAccessSettings';
import { ApiAccessSettings as ApiAccessSettingsType} from '../types/Settings/interfaces';

interface ApiKeyInfo {
    key: string;
    createdAt: Date;
    name: string;
    lastUsed: Date;
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
