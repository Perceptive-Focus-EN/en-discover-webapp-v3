// src/pages/_app.tsx
import 'regenerator-runtime/runtime';
import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from '../contexts/AuthContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { SnackbarProvider } from '../utils/SnackbarManager';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { useState, useEffect, createContext } from 'react';
import baseTheme from '../styles/theme';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { NotificationProvider } from '../components/Notifications/contexts/NotificationContext';
import { PostProvider } from '../feature/context/PostContext'; // New import
import { MoodBoardProvider } from '../contexts/MoodBoardContext';
import { GlobalStateProvider } from '../contexts/GlobalStateContext';
import { AIAssistantProvider } from '../contexts/AIAssistantContext';

interface ThemeModeContextType {
  mode: 'light' | 'dark';
  toggleThemeMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'light',
  toggleThemeMode: () => {},
});

function AppContent({ Component, pageProps }: AppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const { settings } = useSettings();

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      const systemPrefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleThemeMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const muiTheme = createTheme({
    ...baseTheme(mode),
    typography: {
      ...baseTheme(mode).typography,
      fontFamily: settings?.style?.font || baseTheme(mode).typography.fontFamily,
      fontSize: settings?.style?.fontSize || baseTheme(mode).typography.fontSize,
    },
  });

  return (
    <ThemeModeContext.Provider value={{ mode, toggleThemeMode }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GlobalStateProvider>
        <SettingsProvider>
          <AIAssistantProvider>
            <MoodBoardProvider>
              <PostProvider> {/* Added PostProvider */}
                <OnboardingProvider>
                  <NotificationProvider>
                    <SnackbarProvider>
                      <DndProvider backend={HTML5Backend}>
                        {children}
                      </DndProvider>
                    </SnackbarProvider>
                  </NotificationProvider>
                </OnboardingProvider>
              </PostProvider>
            </MoodBoardProvider>
          </AIAssistantProvider>
        </SettingsProvider>
      </GlobalStateProvider>
    </AuthProvider>
  );
}

function MyApp(props: AppProps) {
  return (
    <ProviderWrapper>
      <AppContent {...props} />
    </ProviderWrapper>
  );
}

export default MyApp;