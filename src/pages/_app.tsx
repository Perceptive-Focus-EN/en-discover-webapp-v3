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
import { PostProvider } from '../feature/context/PostContext';
import { MoodBoardProvider } from '../contexts/MoodBoardContext';
import { GlobalStateProvider } from '../contexts/GlobalStateContext';
import { AIAssistantProvider } from '../contexts/AIAssistantContext';
import { SystemMetricsCollector } from '@/MonitoringSystem/utils/SystemMetricsCollector';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ThemeModeContextType {
  mode: 'light' | 'dark';
  toggleThemeMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'light',
  toggleThemeMode: () => {},
});

// Define public routes
const publicRoutes = ['/login', '/signup', '/reset-password', '/magic-link', '/settings/faq', '/settings/privacy-policy', '/settings/terms'];

function AppContent({ Component, pageProps }: AppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const { settings } = useSettings();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Theme initialization
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      const systemPrefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(systemPrefersDark ? 'dark' : 'light');
    }
    setIsInitialized(true);
  }, []);

  // Route protection logic
  useEffect(() => {
    if (!loading && isInitialized) {
      const isPublicRoute = publicRoutes.includes(router.pathname);
      
      if (!user && !isPublicRoute) {
        // Redirect to login if not authenticated and not on a public route
        router.replace('/login');
      } else if (user && isPublicRoute) {
        // Redirect to dashboard if authenticated and on a public route
        router.replace('/moodboard');
      }
    }
  }, [user, loading, router.pathname, isInitialized]);

  // Metrics collector initialization
  useEffect(() => {
    const metricsCollector = SystemMetricsCollector.getInstance();
    return () => {
      metricsCollector.destroy();
    };
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

  // Show loading state while initializing
  if (!isInitialized || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Determine if we should show the layout
  const showLayout = !publicRoutes.includes(router.pathname);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleThemeMode }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {showLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
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
              <PostProvider>
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