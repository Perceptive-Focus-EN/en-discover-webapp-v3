// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { frontendLogger } from '../MonitoringSystem/managers/FrontendMessageHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, error: null, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  
    frontendLogger.error(
      'Uncaught error:',
      'An unexpected error occurred. We\'re looking into it.',
      { error, errorInfo }
    );
    frontendLogger.sendMetrics(); // Send metrics when an error occurs
  }

  private handleReload = () => {
    window.location.reload();
  }

  private handleReportError = () => {
    if (this.state.error) {
      frontendLogger.error(
        'User reported error:',
        'Error has been reported. Thank you!',
        { message: this.state.error.message, stack: this.state.error.stack }
      );
      frontendLogger.sendMetrics();
      this.setState({ hasError: true });
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          padding={3}
          textAlign="center"
        >
          <Typography variant="h4" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" paragraph>
            We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
          </Typography>
          <Box marginY={2}>
            <Button variant="contained" color="primary" onClick={this.handleReload} sx={{ marginRight: 2 }}>
              Refresh Page
            </Button>
            <Button variant="outlined" color="secondary" onClick={this.handleReportError}>
              Report Error
            </Button>
          </Box>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box marginTop={4} textAlign="left" width="100%" overflow="auto">
              <Typography variant="h6" gutterBottom>
                Error Details:
              </Typography>
              <pre className="error-details">
                {this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre className="error-details">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;