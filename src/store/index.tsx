import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cacheReducer from './slices/cacheSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cache: cacheReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;