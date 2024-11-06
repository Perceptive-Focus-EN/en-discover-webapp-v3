// types/Login/interfaces.ts
import { User, UserTenantOperation, TenantQueries } from "../User/interfaces";
import { Tenant } from "../Tenant/interfaces";

export interface LoginRequest {
  email: string;
  password: string;
}

// Separate session information for clarity
export interface SessionInfo {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: string;
}

// Separate auth context for tenant-specific information
export interface AuthContext {
  currentTenant?: Tenant;
  tenantOperations: UserTenantOperation;
  tenantQueries: TenantQueries;
}

// Main auth response
export interface AuthResponse {
  success: boolean;
  message: string;
  
  // User data without sensitive information
  user: Omit<User, 'password'>;
  
  // Session information
  session: SessionInfo;
  
  // Tenant context and operations
  context: AuthContext;
  
  // Additional flags
  onboardingComplete: boolean;
}

// Type guard for successful auth
export function isSuccessfulAuth(response: AuthResponse): response is AuthResponse & { success: true } {
  return response.success === true;
}

// Helper type for handling auth state
export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Omit<User, 'password'> | null;
  session: SessionInfo | null;
  context: AuthContext | null;
};