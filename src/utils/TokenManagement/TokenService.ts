// src/utils/TokenManagement/TokenService.ts
import { AuthResponse } from '@/types/Login/interfaces';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SecurityError, ErrorType } from '@/MonitoringSystem/constants/errors';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import * as clientTokenUtils from './clientTokenUtils';


interface TokenServiceConfig {
  apiBaseUrl: string;
  refreshEndpoint: string;
  storagePrefix?: string;
  tokenExpiryBuffer?: number;
}

export class TokenService {
  private static instance: TokenService;
  private readonly config: TokenServiceConfig;
  private refreshPromise: Promise<AuthResponse> | null = null;

  private constructor(config: TokenServiceConfig) {
    this.config = {
      storagePrefix: 'auth_',
      tokenExpiryBuffer: 300000, // 5 minutes
      ...config
    };
    clientTokenUtils.initializeTokenManagement();
  }

  public static getInstance(config: TokenServiceConfig): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService(config);
    }
    return TokenService.instance;
  }

  // Token Management
  public setTokens(accessToken: string, refreshToken: string, sessionId: string): void {
    try {
      clientTokenUtils.setAccessToken(accessToken);
      clientTokenUtils.setRefreshToken(refreshToken);
      clientTokenUtils.setSessionId(sessionId);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'token',
        'tokens_set',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { success: true }
      );
    } catch (error) {
      monitoringManager.logger.error(
        new Error('Failed to set tokens'),
        SecurityError.TOKEN_OPERATION_FAILED as ErrorType,
        {
          category: LogCategory.SECURITY,
          pattern: LOG_PATTERNS.SECURITY,
          metadata: { error }
        }
      );
      throw error;
    }
  }

  public getAccessToken(): string | null {
    return clientTokenUtils.getAccessToken();
  }

  public getRefreshToken(): string | null {
    return clientTokenUtils.getRefreshToken();
  }

  public getSessionId(): string | null {
    return clientTokenUtils.getSessionId();
  }

  public clearTokens(): void {
    clientTokenUtils.clearSession();
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'token',
      'tokens_cleared',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT
    );
  }

  // User Management
  public storeUser(userJson: string): void {
    try {
      clientTokenUtils.storeUser(userJson);
    } catch (error) {
      monitoringManager.logger.error(
        new Error('Failed to store user'),
        SecurityError.AUTH_TOKEN_FAILED,
        {
          category: LogCategory.SECURITY,
          pattern: LOG_PATTERNS.SECURITY,
          metadata: { error }
        }
      );
      throw error;
    }
  }

  public getStoredUser(): string | null {
    return clientTokenUtils.getStoredUser();
  }

  public clearStoredUser(): void {
    clientTokenUtils.clearStoredUser();
  }

  // Token Validation
  public isTokenExpired(token: string): boolean {
    if (!token) return true;
    const expiryBuffer = this.config.tokenExpiryBuffer || 0;
    try {
      const decoded = clientTokenUtils.getTokenPayload<clientTokenUtils.DecodedToken>(token);
      if (!decoded || !decoded.exp) return true;
      return Date.now() >= (decoded.exp * 1000) - expiryBuffer;
    } catch {
      return true;
    }
  }

    public getTokenPayload<T extends clientTokenUtils.DecodedToken>(token: string): T | null {
    return clientTokenUtils.getTokenPayload<T>(token);
  }

  public async createTokenBindingId(clientPublicKey: string): Promise<string> {
    return clientTokenUtils.createTokenBindingId(clientPublicKey);
  }

  // Token Refresh Logic
  public async refreshTokenIfNeeded(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken || !this.isTokenExpired(accessToken)) {
      return accessToken;
    }

    // Prevent multiple simultaneous refresh attempts
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshTokens();
    }

    try {
      const response = await this.refreshPromise;
      this.refreshPromise = null;
      return response.accessToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async refreshTokens(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    const sessionId = this.getSessionId();

    if (!refreshToken || !sessionId) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_TOKEN_INVALID,
        'No refresh token or session ID available'
      );
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}${this.config.refreshEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken,
          sessionId
        })
      });

      if (!response.ok) {
        throw monitoringManager.error.createError(
          'security',
          SecurityError.AUTH_TOKEN_INVALID,
          'Token refresh failed'
        );
      }

      const data: AuthResponse = await response.json();
      this.setTokens(data.accessToken, data.refreshToken, data.sessionId);
      
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'token',
        'refresh_success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT
      );

      // Cleanup old tokens
      clientTokenUtils.cleanupOldTokens();
      
      return data;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'token',
        'refresh_failed',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT
      );

      this.clearTokens();
      throw error;
    }
  }
}

// Create and export singleton instance
const tokenService = TokenService.getInstance({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  refreshEndpoint: '/api/auth/refresh'
});

export default tokenService;