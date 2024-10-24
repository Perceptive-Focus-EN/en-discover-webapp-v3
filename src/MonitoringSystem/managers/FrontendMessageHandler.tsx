// src/MonitoringSystem/handlers/FrontendMessageHandler.ts

import { DEFAULT_MESSAGES } from '../constants/messages/defaultMessages';

type MessageSeverity = 'success' | 'error' | 'warning' | 'info';

interface MessageConfig {
  duration?: number;
  position?: 'top' | 'bottom';
  showIcon?: boolean;
}

interface ApiError {
  message: string;
  type: string;
  reference?: string;
  statusCode: number;
}

class FrontendMessageHandler {
  private static instance: FrontendMessageHandler;
  private showMessage?: (message: string, severity: MessageSeverity) => void;

  private constructor() {}

  public static getInstance(): FrontendMessageHandler {
    if (!FrontendMessageHandler.instance) {
      FrontendMessageHandler.instance = new FrontendMessageHandler();
    }
    return FrontendMessageHandler.instance;
  }

  public init(
    messageHandler: (message: string, severity: MessageSeverity) => void
  ): void {
    this.showMessage = messageHandler;
  }

  public handleApiError(error: ApiError, config?: MessageConfig): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        message: error.message,
        type: error.type,
        reference: error.reference,
        statusCode: error.statusCode
      });
    }

        // Use provided message or fallback
    this.showMessage?.(error.message || DEFAULT_MESSAGES.ERROR.GENERIC, 'error');
  }


 public success(message: string, config?: MessageConfig): void {
    this.showMessage?.(message || DEFAULT_MESSAGES.SUCCESS.GENERIC, 'success');
  }

  public error(message: string, config?: MessageConfig): void {
    this.showMessage?.(message || DEFAULT_MESSAGES.ERROR.GENERIC, 'error');
  }

  public warning(message: string, config?: MessageConfig): void {
    this.showMessage?.(message || DEFAULT_MESSAGES.ERROR.GENERIC, 'warning');
    }

  public info(message: string, config?: MessageConfig): void {
    this.showMessage?.(message || DEFAULT_MESSAGES.SUCCESS.GENERIC, 'info');
  }
}

export const messageHandler = FrontendMessageHandler.getInstance();




















// In your API calls
// try {
  // const response = await api.get('/users');
  // messageHandler.success('Users loaded successfully');
// } catch (error) {
  // messageHandler.handleApiError(error.response.data);
// }
// 
// function SubmitButton() {
  // const handleClick = () => {
    // messageHandler.info('Processing your request...');
  // };
// 
  // return <button onClick={handleClick}>Submit</button>;
// }