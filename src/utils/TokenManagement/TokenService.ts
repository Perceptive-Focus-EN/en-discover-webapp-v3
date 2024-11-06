// src/utils/TokenManagement/TokenService.ts
import { AuthResponse } from '@/types/Login/interfaces';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SecurityError } from '@/MonitoringSystem/constants/errors';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import * as clientTokenUtils from './clientTokenUtils';
import { DecodedToken } from './clientTokenUtils';

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
  private static lastRefreshAttempt = 0;
  private static REFRESH_COOL_DOWN = 5 * 60 * 1000; // 5 minutes

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
  }

  public storeUser(userJson: string): void {
    clientTokenUtils.storeUser(userJson);
  }

  public clearStoredUser(): void {
    clientTokenUtils.clearStoredUser();
  }

  public isTokenExpired(token: string): boolean {
    return clientTokenUtils.isTokenExpired(token);
  }

  public getTokenPayload<T extends DecodedToken>(token: string): T | null {
    return clientTokenUtils.getTokenPayload<T>(token);
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

  public getStoredUser(): any {
    return clientTokenUtils.getStoredUser();
  }

  public clearAllTokens(): void {
    clientTokenUtils.clearTokens();
    clientTokenUtils.clearSession();
    monitoringManager.logger.info('All tokens cleared', { category: LogCategory.SECURITY });
  }

  public async refreshTokenIfNeeded(): Promise<string | null> {
    const accessToken = this.getAccessToken();

    if (!accessToken || !this.isTokenExpired(accessToken)) {
      return accessToken;
    }

    const now = Date.now();
    if (now - TokenService.lastRefreshAttempt < TokenService.REFRESH_COOL_DOWN) {
      monitoringManager.logger.warn('Token refresh attempted too soon', {
        timeSinceLastAttempt: now - TokenService.lastRefreshAttempt
      });
      return accessToken;
    }

    TokenService.lastRefreshAttempt = now;

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshTokens();
    }

    try {
      const response = await this.refreshPromise;
      this.refreshPromise = null;
      return response.session.accessToken;
    } catch (error) {
      this.refreshPromise = null;
      monitoringManager.logger.error(
        new Error('Token refresh failed'),
        SecurityError.AUTH_TOKEN_FAILED,
        {
          category: LogCategory.SECURITY,
          pattern: LOG_PATTERNS.SECURITY,
          metadata: { error, tokenPresent: !!accessToken }
        }
      );
      this.clearAllTokens();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, sessionId })
      });

      if (!response.ok) {
        throw monitoringManager.error.createError(
          'security',
          SecurityError.AUTH_TOKEN_INVALID,
          'Token refresh failed'
        );
      }

      const data: AuthResponse = await response.json();
      this.setTokens(
        data.session.accessToken,
        data.session.refreshToken,
        data.session.sessionId
      );
      return data;
    } catch (error) {
      this.clearAllTokens();
      throw error;
    }
  }
}

const tokenService = TokenService.getInstance({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  refreshEndpoint: '/api/auth/refresh'
});

export default tokenService;
