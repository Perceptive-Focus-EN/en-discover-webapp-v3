import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Typography } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onReset?: () => void;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.FallbackComponent) {
        return <this.props.FallbackComponent
          error={this.state.error!}
          resetErrorBoundary={this.resetErrorBoundary}
        />;
      }
      // Default fallback
      return (
        <Typography color="error">
          {this.props.fallbackMessage || 'Something went wrong. Please try again.'}
        </Typography>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;