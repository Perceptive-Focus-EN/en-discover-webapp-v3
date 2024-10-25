// src/lib/api_s/emailApi.ts
import { api } from '../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

export const emailApi = {
  verifyEmail: async (verificationToken: string): Promise<EmailVerificationResponse> => {
    const response = await api.post<EmailVerificationResponse>(
      '/api/auth/verify-email',
      { verificationToken }
    );
    messageHandler.success('Email verified successfully');
    return response;
  },
  
  resendVerificationEmail: async (): Promise<EmailVerificationResponse> => {
    const response = await api.post<EmailVerificationResponse>(
      '/api/auth/resend-verification'
    );
    messageHandler.success('Verification email sent successfully');
    return response;
  },
};

export default emailApi;