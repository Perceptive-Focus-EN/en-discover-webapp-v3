// types/Login/interfaces.tsx

import {ExtendedUserInfo } from "../User/interfaces";
import { Permissions } from '../../constants/AccessKey/permissions';

// Login interface
export interface LoginRequest {
  email: string;
  password: string;
}
export interface AuthResponse {
  [x: string]: string | boolean | ExtendedUserInfo | Permissions[] | string;
  success: boolean;
  message: string;
  user: ExtendedUserInfo;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  onboardingComplete: boolean;
}