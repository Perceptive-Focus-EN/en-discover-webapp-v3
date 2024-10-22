// src/utils/TokenManagement/authManager.ts
import { logger } from '../ErrorHandling/logger';
import * as clientTokenUtils from './clientTokenUtils';
import { AuthResponse } from '../../types/Login/interfaces';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let sessionId: string | null = null;
let userId: string | null = null;

const isBrowser = typeof window !== 'undefined';
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };

  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const setTokens = (newAccessToken: string, newRefreshToken: string, newSessionId: string) => {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  sessionId = newSessionId;
  if (isBrowser) {
    clientTokenUtils.setAccessToken(newAccessToken);
    clientTokenUtils.setRefreshToken(newRefreshToken);
    clientTokenUtils.setSessionId(newSessionId);
  }
};

export const getAccessToken = () => isBrowser ? clientTokenUtils.getAccessToken() : accessToken;
export const getRefreshToken = () => isBrowser ? clientTokenUtils.getRefreshToken() : refreshToken;
export const getSessionId = () => isBrowser ? clientTokenUtils.getSessionId() : sessionId;

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  sessionId = null;
  if (isBrowser) {
    clientTokenUtils.clearSession();
  }
  clearStoredUser();
};

export const requestMagicLink = async (email: string): Promise<void> => {
  try {
    await fetchWithAuth(API_ENDPOINTS.REQUEST_MAGIC_LINK, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    logger.error(new Error('Magic link request error'), { error: err });
    throw err;
  }
};

export const verifyMagicLink = async (token: string): Promise<AuthResponse> => {
  try {
    const response = await fetchWithAuth(`${API_ENDPOINTS.VERIFY_MAGIC_LINK}/${token}`, {
      method: 'GET',
    });
    if (response) {
      setTokens(response.accessToken, response.refreshToken, response.sessionId);
      storeUser(JSON.stringify(response.user));
      return response;
    }
    throw new Error('Invalid response from server');
  } catch (err) {
    logger.error(new Error('Magic link verification error'), { error: err });
    throw err;
  }
};

export const revokeTokens = async (): Promise<AuthResponse | null> => {
  try {
    const currentRefreshToken = getRefreshToken();
    const currentSessionId = getSessionId();
    const currentUserId = getUserId();
    if (currentRefreshToken && currentSessionId && currentUserId) {
      const response = await fetchWithAuth(API_ENDPOINTS.REVOKE_TOKENS, {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: currentRefreshToken,
          sessionId: currentSessionId,
          userId: currentUserId
        }),
      });
      if (response) {
        setTokens(response.accessToken, response.refreshToken, response.sessionId);
        storeUser(JSON.stringify(response.user));
        return response;
      }
    }
    return null;
  } catch (err) {
    logger.error(new Error('Token revocation error'), { error: err });
    return null;
  }
};

export const refreshTokens = async (): Promise<AuthResponse | null> => {
  try {
    const currentRefreshToken = getRefreshToken();
    const currentSessionId = getSessionId();
    if (currentRefreshToken && currentSessionId) {
      const response = await fetchWithAuth(API_ENDPOINTS.REFRESH_TOKENS, {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: currentRefreshToken,
          sessionId: currentSessionId
        }),
      });
      if (response) {
        setTokens(response.accessToken, response.refreshToken, response.sessionId);
        storeUser(JSON.stringify(response.user));
        return response;
      }
    }
    return null;
  } catch (err) {
    logger.error(new Error('Token refresh error'), { error: err });
    return null;
  }
};

export const getUserId = () => userId;

export const logout = async () => {
  try {
    await revokeTokens();
    await fetchWithAuth(API_ENDPOINTS.LOGOUT_USER, { method: 'POST' });
    clearTokens();
  } catch (err) {
    logger.error(new Error('Logout error'), { error: err });
  }
};

export const storeUser = (userJson: string) => {
  if (isBrowser) {
    clientTokenUtils.storeUser(userJson);
    const parsedUser = JSON.parse(userJson);
    userId = parsedUser._id || parsedUser.id; // Use _id if available, fallback to id
  }
};

export const getStoredUser = () => {
  return isBrowser ? clientTokenUtils.getStoredUser() : null;
};


// Add this new function
export const initializeTokenManagement = () => {
  if (isBrowser) {
    clientTokenUtils.initializeTokenManagement();
  }
};

// Modify the initialization part at the bottom of the file
if (isBrowser) {
  initializeTokenManagement();
  const storedUser = getStoredUser();
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    userId = parsedUser.userId || parsedUser.userId;
  }
}

export const isTokenAboutToExpire = (token: string, thresholdMs: number = 300000): boolean => {
  if (!token) return true;
  try {
    const decoded = clientTokenUtils.getTokenPayload(token);
    if (decoded && 'exp' in decoded) {
      return (decoded.exp as number) * 1000 - Date.now() < thresholdMs;
    }
    return true;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

export const clearStoredUser = () => {
  if (isBrowser) {
    clientTokenUtils.clearStoredUser();
  }
  userId= null;
};

// Re-export some functions from clientTokenUtils for convenience
export const { isTokenExpired, getTokenPayload } = clientTokenUtils;

// Initialize tokens and user
if (isBrowser) {
  clientTokenUtils.initializeFromLocalStorage();
  const storedUser = getStoredUser();
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    userId = parsedUser.userId || parsedUser.userId; // Use _id if available, fallback to id
  }
}

export default {
  setTokens,
  getAccessToken,
  getRefreshToken,
  getSessionId,
  clearTokens,
  revokeTokens,
  refreshTokens,
  getUserId,
  logout,
  storeUser,
  getStoredUser,
  clearStoredUser,
  isTokenExpired,
  getTokenPayload,
  requestMagicLink,
  verifyMagicLink
};