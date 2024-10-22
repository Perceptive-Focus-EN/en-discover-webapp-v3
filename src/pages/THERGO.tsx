import React from 'react';
import AIAssistant from '../components/AIAssistant';
import { AIAssistantProvider } from '@/contexts/AIAssistantContext';

const Thergo: React.FC = () => {
  return (
    <AIAssistantProvider>
      <div style={{ backgroundColor: 'transparent' }}>
        <h1>My AI Assistant Page</h1>
        <AIAssistant />
      </div>
    </AIAssistantProvider>
  );
};

export default Thergo;