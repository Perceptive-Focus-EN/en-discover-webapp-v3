import axiosInstance from '../axiosSetup';

export const emailApi = {
  verifyEmail: async (verificationToken: string) => {
    const response = await axiosInstance.post('/api/auth/verify-email', { verificationToken });
    return response.data;
  },
  
  resendVerificationEmail: async () => {
    const response = await axiosInstance.post('/api/auth/resend-verification');
    return response.data;
  },
};

export default emailApi;
