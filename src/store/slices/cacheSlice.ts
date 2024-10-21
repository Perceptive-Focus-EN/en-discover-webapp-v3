import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CacheItem<T> {
  data: T;
  expiry: number;
}

interface CacheState {
  [key: string]: CacheItem<any>;
}

const initialState: CacheState = {};

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    setCacheItem: (state, action: PayloadAction<{ key: string; data: any; duration: number }>) => {
      const { key, data, duration } = action.payload;
      state[key] = {
        data,
        expiry: Date.now() + duration,
      };
    },
    clearCacheItem: (state, action: PayloadAction<string>) => {
      delete state[action.payload];
    },
    clearExpiredCache: (state) => {
      const now = Date.now();
      Object.keys(state).forEach((key) => {
        if (state[key].expiry < now) {
          delete state[key];
        }
      });
    },
  },
});

export const { setCacheItem, clearCacheItem, clearExpiredCache } = cacheSlice.actions;
export default cacheSlice.reducer;