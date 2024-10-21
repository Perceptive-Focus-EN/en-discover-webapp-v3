import { createTheme, ThemeOptions } from '@mui/material/styles';

const createCustomTheme = (mode: 'light' | 'dark'): ThemeOptions => {
  const purpleGradient = {
    light: 'linear-gradient(135deg, #997CEF 0%, #6E43EB 100%)',
    dark: 'linear-gradient(135deg, #B49AF3 0%, #8E6BEF 100%)',
  };

  const complementaryColor = mode === 'light' ? '#FFD700' : '#FFB347';

  return {
    palette: {
      mode,
      background: {
        default: mode === 'light' ? '#F8F9FA' : '#121212',
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      },
      primary: {
        main: mode === 'light' ? '#6E43EB' : '#B49AF3',
        dark: mode === 'light' ? '#4A0E8F' : '#8E6BEF',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: complementaryColor,
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#E0E0E0',
        secondary: mode === 'light' ? '#666666' : '#BBBBBB',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.01562em',
        color: mode === 'light' ? '#333333' : '#FFFFFF',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        letterSpacing: '-0.00833em',
        color: mode === 'light' ? '#6E43EB' : '#B49AF3',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '0em',
        color: mode === 'light' ? '#4A0E8F' : '#8E6BEF',
      },
      h6: {
        fontSize: '1.1rem',
        fontWeight: 500,
        letterSpacing: '0.0075em',
        color: mode === 'light' ? '#333333' : '#FFFFFF',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0.00938em',
        color: mode === 'light' ? '#333333' : '#E0E0E0',
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
        letterSpacing: '0.01071em',
        color: mode === 'light' ? '#666666' : '#BBBBBB',
      },
    },
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            maxWidth: '1200px',
            margin: '2rem auto',
            padding: '2rem',
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
            borderRadius: '12px',
            boxShadow: `0 4px 20px rgba(0, 0, 0, ${mode === 'light' ? '0.05' : '0.2'})`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
            borderRadius: '8px',
            boxShadow: `0 2px 8px rgba(0, 0, 0, ${mode === 'light' ? '0.08' : '0.2'})`,
            transition: 'box-shadow 0.3s ease',
            '&:hover': {
              boxShadow: `0 4px 12px rgba(0, 0, 0, ${mode === 'light' ? '0.12' : '0.3'})`,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            '&:focus': {
              outline: `2px solid ${mode === 'light' ? '#6E43EB' : '#B49AF3'}`,
            },
          },
          contained: {
            background: purpleGradient[mode],
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              background: purpleGradient[mode],
              filter: 'brightness(105%)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            },
          },
          outlined: {
            borderColor: mode === 'light' ? '#6E43EB' : '#B49AF3',
            color: mode === 'light' ? '#6E43EB' : '#B49AF3',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(110, 67, 235, 0.04)' : 'rgba(180, 154, 243, 0.12)',
              borderColor: mode === 'light' ? '#4A0E8F' : '#8E6BEF',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '6px',
              transition: 'border-color 0.2s ease',
              '& fieldset': {
                borderColor: mode === 'light' ? '#E0E0E0' : '#444444',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#6E43EB' : '#B49AF3',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'light' ? '#6E43EB' : '#B49AF3',
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            boxShadow: `0 2px 8px rgba(0, 0, 0, ${mode === 'light' ? '0.08' : '0.2'})`,
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 6px 16px rgba(0, 0, 0, ${mode === 'light' ? '0.12' : '0.3'})`,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            fontWeight: 500,
            backgroundColor: mode === 'light' ? '#E8E0FF' : '#3D1A8B',
            color: mode === 'light' ? '#4A0E8F' : '#FFFFFF',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#D0C0FF' : '#4D2A9B',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#6E43EB' : '#B49AF3',
            transition: 'background-color 0.2s ease, color 0.2s ease',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(110, 67, 235, 0.08)' : 'rgba(180, 154, 243, 0.16)',
              color: mode === 'light' ? '#4A0E8F' : '#8E6BEF',
            },
            '&:focus': {
              outline: `2px solid ${mode === 'light' ? '#6E43EB' : '#B49AF3'}`,
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#6E43EB' : '#B49AF3',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            '&:hover': {
              color: mode === 'light' ? '#4A0E8F' : '#8E6BEF',
              textDecoration: 'underline',
            },
            '&:focus': {
              outline: `2px solid ${mode === 'light' ? '#6E43EB' : '#B49AF3'}`,
            },
          },
        },
      },
    },
  };
};

const theme = (mode: 'light' | 'dark') => createTheme(createCustomTheme(mode));

export default theme;