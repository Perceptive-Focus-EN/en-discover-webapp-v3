// src/types/verifyEmail.ts
export interface VerifyEmailRequestBody {
  token: string;
}

export interface VerifyEmailResponseData {
  message: string;
  role?: string;
  error?: string;
}
