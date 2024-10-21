// src/services/cache/universalCacheService.ts

interface CacheService {
  getValue(key: string): Promise<string | null>;
  setValue(key: string, value: string, expiryTime?: number): Promise<void>;
  deleteValue(key: string): Promise<void>;
}

class BrowserCacheService implements CacheService {
  async getValue(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setValue(key: string, value: string, expiryTime?: number): Promise<void> {
    localStorage.setItem(key, value);
    if (expiryTime) {
      const expiryDate = new Date().getTime() + expiryTime * 1000;
      localStorage.setItem(`${key}_expiry`, expiryDate.toString());
    }
  }

  async deleteValue(key: string): Promise<void> {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_expiry`);
  }
}

let cacheService: CacheService;

if (typeof window === 'undefined') {
  // Server-side
  import('./redisService').then(({ redisService }) => {
    cacheService = redisService;
  });
} else {
  // Client-side
  cacheService = new BrowserCacheService();
}

export const universalCacheService = {
  getValue: async (key: string) => {
    return cacheService.getValue(key);
  },
  setValue: async (key: string, value: string, expiryTime?: number) => {
    return cacheService.setValue(key, value, expiryTime);
  },
  deleteValue: async (key: string) => {
    return cacheService.deleteValue(key);
  },
};