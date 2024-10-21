import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useGlobalState } from './GlobalStateContext';
import { TenantInfo } from '@/types/Tenant/interfaces';

export interface AIAssistantState {
  isActive: boolean;
  currentPage: string;
  currentTenant: TenantInfo | null;
  userId: string | null;
  showInput: boolean;
  generatedResponse: string;
  selectedVoice: string;
  showCombinedSelector: boolean;
  audioUrl: string;
  isSynthesizing: boolean;
  isLoading: boolean;
  buttonColor: string;
  buttonGradient: string;
  selectedBoxShadow: string;
  selectedBubble: string | null;
}

export type AIAssistantAction =
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'SET_TENANT'; payload: TenantInfo | null }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_SHOW_INPUT'; payload: boolean }
  | { type: 'SET_GENERATED_RESPONSE'; payload: string }
  | { type: 'SET_SELECTED_VOICE'; payload: string }
  | { type: 'SET_SHOW_COMBINED_SELECTOR'; payload: boolean }
  | { type: 'SET_AUDIO_URL'; payload: string }
  | { type: 'SET_IS_SYNTHESIZING'; payload: boolean }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'SET_BUTTON_COLOR'; payload: string }
  | { type: 'SET_BUTTON_GRADIENT'; payload: string }
  | { type: 'SET_SELECTED_BOX_SHADOW'; payload: string }
  | { type: 'SET_SELECTED_BUBBLE'; payload: string | null };

const initialState: AIAssistantState = {
  isActive: false,
  currentPage: '',
  currentTenant: null,
  userId: null,
  showInput: false,
  generatedResponse: '',
  selectedVoice: 'onyx',
  showCombinedSelector: false,
  audioUrl: '',
  isSynthesizing: false,
  isLoading: false,
  buttonColor: 'blue',
  buttonGradient: 'linear-gradient(180deg, #C0EB86 0%, #86B15C 100%)',
  selectedBoxShadow: '',
  selectedBubble: null,
};

const AIAssistantContext = createContext<{
  state: AIAssistantState;
  dispatch: React.Dispatch<AIAssistantAction>;
  toggleAIAssistant: () => void;
} | undefined>(undefined);

const aiAssistantReducer = (state: AIAssistantState, action: AIAssistantAction): AIAssistantState => {
  switch (action.type) {
    case 'SET_ACTIVE':
      return { ...state, isActive: action.payload };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_TENANT':
      return { ...state, currentTenant: action.payload };
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    case 'SET_SHOW_INPUT':
      return { ...state, showInput: action.payload };
    case 'SET_GENERATED_RESPONSE':
      return { ...state, generatedResponse: action.payload };
    case 'SET_SELECTED_VOICE':
      return { ...state, selectedVoice: action.payload };
    case 'SET_SHOW_COMBINED_SELECTOR':
      return { ...state, showCombinedSelector: action.payload };
    case 'SET_AUDIO_URL':
      return { ...state, audioUrl: action.payload };
    case 'SET_IS_SYNTHESIZING':
      return { ...state, isSynthesizing: action.payload };
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_BUTTON_COLOR':
      return { ...state, buttonColor: action.payload };
    case 'SET_BUTTON_GRADIENT':
      return { ...state, buttonGradient: action.payload };
    case 'SET_SELECTED_BOX_SHADOW':
      return { ...state, selectedBoxShadow: action.payload };
    case 'SET_SELECTED_BUBBLE':
      return { ...state, selectedBubble: action.payload };
    default:
      return state;
  }
};

export const AIAssistantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiAssistantReducer, initialState);
  const { currentTenant, userId } = useGlobalState();

  useEffect(() => {
    dispatch({ type: 'SET_TENANT', payload: currentTenant });
  }, [currentTenant]);

  useEffect(() => {
    dispatch({ type: 'SET_USER_ID', payload: userId });
  }, [userId]);

  const toggleAIAssistant = () => {
    dispatch({ type: 'SET_ACTIVE', payload: !state.isActive });
  };

  return (
    <AIAssistantContext.Provider value={{ state, dispatch, toggleAIAssistant }}>
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};