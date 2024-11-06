// src/utils/TokenManagement/authManager.ts
import tokenService from './TokenService';
import { AuthResponse, SessionInfo, AuthContext } from '../../types/Login/interfaces';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SecurityError } from '@/MonitoringSystem/constants/errors';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { DecodedToken } from './clientTokenUtils';
import { User } from '@/types/User/interfaces';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Enhanced fetchWithAuth using TokenService
const fetchWithAuth = async (url: string, options: RequestInit = {}, retryCount: number = 1): Promise<any> => {
  const startTime = Date.now();
  try {
    const token = await tokenService.refreshTokenIfNeeded();
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };

    const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    
    if (!response.ok) {
      if (response.status === 401 && retryCount > 0) {
        await tokenService.refreshTokenIfNeeded();
        return fetchWithAuth(url, options, retryCount - 1);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'api',
      'request_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { endpoint: url }
    );

    return response.json();
  } catch (error) {
    monitoringManager.logger.error(
      new Error('API request failed'),
      SecurityError.API_REQUEST_FAILED,
      {
        category: LogCategory.SYSTEM,
        pattern: LOG_PATTERNS.SYSTEM,
        metadata: {
          url,
          error: error instanceof Error ? error.message : 'unknown',
          duration: Date.now() - startTime
        }
      }
    );
    throw error;
  }
};

export const authManager = {
  // Token Management (delegated to TokenService)
  async getValidToken(): Promise<string | null> {
    return tokenService.refreshTokenIfNeeded();
  },

  setTokens(accessToken: string, refreshToken: string, sessionId: string): void {
    tokenService.setTokens(accessToken, refreshToken, sessionId);
  },

  // User Management (delegated to TokenService)
  storeUser(userJson: string): void {
    tokenService.storeUser(userJson);
  },

  getStoredUser(): string | null {
    return tokenService.getStoredUser();
  },

  clearStoredUser(): void {
    tokenService.clearStoredUser();
  },

  // Auth State Management
  async setAuthState(authResponse: AuthResponse): Promise<void> {
    tokenService.setTokens(
      authResponse.session.accessToken,
      authResponse.session.refreshToken,
      authResponse.session.sessionId
    );
    tokenService.storeUser(JSON.stringify(authResponse.user));
  },

  // Auth Operations
  async refreshTokens(): Promise<AuthResponse | null> {
    try {
      const token = await tokenService.refreshTokenIfNeeded();
      if (!token) return null;

      const refreshToken = tokenService.getRefreshToken();
      const sessionId = tokenService.getSessionId();
      const storedUser = tokenService.getStoredUser();

      if (!storedUser) {
        throw new Error('No stored user data found');
      }

      const parsedUser = JSON.parse(storedUser) as Omit<User, 'password'>;
      const currentTenantId = parsedUser.tenants.context.currentTenantId;
      const currentAssociation = parsedUser.tenants.associations[currentTenantId];

      const sessionInfo: SessionInfo = {
        accessToken: token,
        refreshToken: refreshToken || '',
        sessionId: sessionId || '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const context: AuthContext = {
        currentTenant: undefined, // Will be populated by server
        tenantOperations: {
          switchTenant: async (tenantId: string) => {
            // Implementation provided by client
          },
          getCurrentTenantRole: () => currentAssociation.role,
          getCurrentTenantPermissions: () => currentAssociation.permissions,
          isPersonalTenant: (tenantId: string) => 
            tenantId === parsedUser.tenants.context.personalTenantId
        },
        tenantQueries: {
          getCurrentTenant: () => currentTenantId,
          getPersonalTenant: () => parsedUser.tenants.context.personalTenantId,
          getTenantRole: (tenantId: string) => 
            parsedUser.tenants.associations[tenantId]?.role,
          getTenantPermissions: (tenantId: string) => 
            parsedUser.tenants.associations[tenantId]?.permissions || [],
          hasActiveTenantAssociation: (tenantId: string) => 
            parsedUser.tenants.associations[tenantId]?.status === 'active'
        }
      };

      return {
        success: true,
        message: 'Tokens refreshed successfully',
        user: parsedUser,
        session: sessionInfo,
        context,
        onboardingComplete: parsedUser.onboardingStatus?.isOnboardingComplete || false
      };
    } catch (error) {
      monitoringManager.logger.error(
        new Error('Token refresh failed'), 
        SecurityError.AUTH_TOKEN_FAILED, 
        {
          category: LogCategory.SECURITY,
          pattern: LOG_PATTERNS.SECURITY,
          metadata: { error }
        }
      );
      return null;
    }
  },

  async refreshAuth(): Promise<void> {
    const response = await this.refreshTokens();
    if (!response) {
      throw new Error('Failed to refresh authentication');
    }
  },

  // Magic Link Operations
  async requestMagicLink(email: string): Promise<void> {
    await fetchWithAuth(API_ENDPOINTS.REQUEST_MAGIC_LINK, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await fetchWithAuth(`${API_ENDPOINTS.VERIFY_MAGIC_LINK}/${token}`, {
      method: 'GET',
    });
    if (response) {
      await this.setAuthState(response);
      return response;
    }
    throw new Error('Invalid magic link response');
  },

  // Session Management
  async revokeTokens(): Promise<AuthResponse | null> {
    const refreshToken = tokenService.getRefreshToken();
    const sessionId = tokenService.getSessionId();
    const tokenPayload = tokenService.getTokenPayload<DecodedToken>(tokenService.getAccessToken() || '');
    const userId = tokenPayload?.userId;

    if (refreshToken && sessionId && userId) {
      const response = await fetchWithAuth(API_ENDPOINTS.REVOKE_TOKENS, {
        method: 'POST',
        body: JSON.stringify({ refreshToken, sessionId, userId }),
      });
      if (response) {
        await this.setAuthState(response);
        return response;
      }
    }
    return null;
  },

  async logout(): Promise<void> {
    const startTime = Date.now();
    try {
      // Get the current token before clearing
      const currentToken = tokenService.getAccessToken();
      
      // Clear tokens first to prevent further authenticated requests
      tokenService.clearAllTokens();
      tokenService.clearStoredUser();

      // Only try to revoke if we had a token
      if (currentToken) {
        try {
          // Make the logout request with the stored token
          await fetch(`${BASE_URL}${API_ENDPOINTS.LOGOUT_USER}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          // Log but don't throw - we still want to clear local state
          console.error('Logout request failed:', error);
        }
      }

      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'logout_success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { duration: Date.now() - startTime }
      );
    } catch (error) {
      monitoringManager.logger.error(
        new Error('Logout failed'),
        SecurityError.AUTH_LOGOUT_FAILED,
        {
          category: LogCategory.SECURITY,
          pattern: LOG_PATTERNS.SECURITY,
          metadata: {
            error,
            duration: Date.now() - startTime
          }
        }
      );
    }
  },

  // Auth Status
  isAuthenticated(): boolean {
    const accessToken = tokenService.getAccessToken();
    return !!accessToken && !tokenService.isTokenExpired(accessToken);
  }
};

export default authManager;