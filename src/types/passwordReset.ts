// src/types/passwordReset.ts
export interface PasswordResetRequest {
  email: string;
  name: string;
}

export interface PasswordResetToken {
  token: string;
  expiresAt: Date;
}

export interface PasswordResetProps {
  onPasswordResetRequest: (email: string, name: string) => Promise<void>;
}
