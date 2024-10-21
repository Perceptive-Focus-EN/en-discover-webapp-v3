// src/utils/clientTokenUtils.ts

// 
// clientTokenUtils.ts: 
// This file should handle only client - side token operations,
  // specifically interacting with localStorage.
  // It shouldn't make API calls or handle server-side logic.
// 

import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

const MAX_TOKEN_SIZE = 2048; // Adjust this value based on your token size
const TOKEN_PREFIX = 'token_';

const setItem = (key: string, value: string): void => {
  if (value.length > MAX_TOKEN_SIZE) {
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
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export const setAccessToken = (token: string): void => setItem('accessToken', token);
export const getAccessToken = (): string | null => getItem('accessToken');
export const setRefreshToken = (token: string): void => setItem('refreshToken', token);
export const getRefreshToken = (): string | null => getItem('refreshToken');
export const setSessionId = (sessionId: string): void => setItem('sessionId', sessionId);
export const getSessionId = (): string | null => getItem('sessionId');

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
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

export const clearSession = (): void => {
  clearTokens();
  localStorage.removeItem('sessionId');
  sessionStorage.removeItem('sessionId');
};

export const getTokenPayload = <T extends object>(token: string): T | null => {
  try {
    return jwtDecode<T>(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const storeUser = (userJson: string): void => setItem('user', userJson);
export const getStoredUser = (): string | null => getItem('user');
export const clearStoredUser = (): void => {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

export const initializeFromLocalStorage = (): void => {
  const accessToken = getItem('accessToken') || '';
  const refreshToken = getItem('refreshToken') || '';
  const sessionId = getItem('sessionId') || '';
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
  setSessionId(sessionId);
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

// Call this function periodically or on app startup
export const initializeTokenManagement = (): void => {
  initializeFromLocalStorage();
  cleanupOldTokens();
};