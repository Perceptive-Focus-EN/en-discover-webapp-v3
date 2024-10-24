// src/lib/api_s/emailApi.ts
import axiosInstance from '../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const emailApi = {
  verifyEmail: async (verificationToken: string) => {
    const response = await axiosInstance.post('/api/auth/verify-email', { verificationToken });
    messageHandler.success('Email verified successfully');
    return response.data;
  },
  
  resendVerificationEmail: async () => {
    const response = await axiosInstance.post('/api/auth/resend-verification');
    messageHandler.success('Verification email sent successfully');
    return response.data;
  },
};

export default emailApi;