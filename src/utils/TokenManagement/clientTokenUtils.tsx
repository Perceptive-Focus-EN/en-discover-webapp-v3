// src/utils/TokenManagement/clientTokenUtils.ts
import { SessionInfo } from "@/types/Login/interfaces";
import { jwtDecode } from "jwt-decode";

const isBrowser = typeof window !== 'undefined';

// Base token interface
export interface DecodedToken {
  exp: number;
  iat: number;
  userId: string;
  email?: string;
  role?: string;
  tenantId?: string;
  session?: SessionInfo
  // ... any other JWT standard fields
}

const MAX_TOKEN_SIZE = 2048;
const TOKEN_PREFIX = 'token_';

const setItem = (key: string, value: string): void => {
  if (!isBrowser) return;

  if (value && value.length > MAX_TOKEN_SIZE) {
    console.warn(`${key} exceeds maximum size. Using sessionStorage.`);
    sessionStorage.setItem(key, value);
  } else {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
      sessionStorage.setItem(key, value);
    }
  }
};

const getItem = (key: string): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export const setAccessToken = (token: string): void => setItem('accessToken', token);
export const getAccessToken = (): string | null => getItem('accessToken');
export const setRefreshToken = (token: string): void => setItem('refreshToken', token);
export const getRefreshToken = (): string | null => getItem('refreshToken');
export const setSessionId = (sessionId: string): void => setItem('sessionId', sessionId);
export const getSessionId = (): string | null => getItem('sessionId');
export const storeUser = (userJson: string): void => setItem('user', userJson);
export const getStoredUser = (): string | null => getItem('user');

export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

export const clearTokens = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

export const clearSession = (): void => {
  if (!isBrowser) return;
  clearTokens();
  localStorage.removeItem('sessionId');
  sessionStorage.removeItem('sessionId');
};

export const clearStoredUser = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};


// Keep your existing code, but update getTokenPayload:
export const getTokenPayload = <T extends DecodedToken>(token: string): T | null => {
  try {
    return jwtDecode<T>(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const createTokenBindingId = async (clientPublicKey: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(clientPublicKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256-${hashHex}`;
};

export const cleanupOldTokens = (): void => {
  if (!isBrowser) return;
  const currentTime = Date.now() / 1000;
  const tokenKeys = Object.keys(localStorage).filter(key => key.startsWith(TOKEN_PREFIX));
  
  tokenKeys.forEach(key => {
    const token = localStorage.getItem(key);
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp < currentTime) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem(key);
      }
    }
  });
};

export const initializeTokenManagement = (): void => {
  if (!isBrowser) return;
  cleanupOldTokens();
};