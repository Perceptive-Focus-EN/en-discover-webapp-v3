import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExtendedUserInfo } from '../../types/User/interfaces';
import { Permissions } from '../../constants/AccessKey/permissions';
import { OnboardingStatusDetails } from '@/types/Onboarding/interfaces';

interface UserState {
  info: ExtendedUserInfo | null;
  avatarUrl: string | null;
}

const initialState: UserState = {
  info: null,
  avatarUrl: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<ExtendedUserInfo>) => {
      state.info = action.payload;
      state.avatarUrl = action.payload.avatarUrl || null;
    },
    updateUserInfo: (state, action: PayloadAction<Partial<ExtendedUserInfo>>) => {
      if (state.info) {
        state.info = { ...state.info, ...action.payload };
        if (action.payload.avatarUrl !== undefined) {
          state.avatarUrl = action.payload.avatarUrl;
        }
      }
    },
    setUserAvatar: (state, action: PayloadAction<string>) => {
      state.avatarUrl = action.payload;
      if (state.info) {
        state.info.avatarUrl = action.payload;
      }
    },
    updatePermissions: (state, action: PayloadAction<Partial<Record<Permissions, boolean>>>) => {
      if (state.info && state.info.permissions) {
        state.info.permissions = { 
          ...state.info.permissions, 
          ...action.payload 
        };
      }
    },
    clearUserInfo: (state) => {
      state.info = null;
      state.avatarUrl = null;
    },
  },
});

export const {
  setUserInfo,
  updateUserInfo,
  setUserAvatar,
  updatePermissions,
  clearUserInfo
} = userSlice.actions;

export default userSlice.reducer;