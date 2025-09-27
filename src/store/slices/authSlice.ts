import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean;
  isPasswordSet: boolean;
  isBiometricEnabled: boolean;
  isAutoLockEnabled: boolean;
  autoLockTimeout: number; // in minutes
  lastAuthTime: number;
  authMethod: 'password' | 'biometric' | null;
  isLocked: boolean;
  lockReason: 'timeout' | 'manual' | 'app_background' | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isPasswordSet: false,
  isBiometricEnabled: false,
  isAutoLockEnabled: true,
  autoLockTimeout: 5, // 5 minutes default
  lastAuthTime: 0,
  authMethod: null,
  isLocked: false,
  lockReason: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<{ 
      isAuthenticated: boolean; 
      method?: 'password' | 'biometric';
    }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      if (action.payload.isAuthenticated) {
        state.authMethod = action.payload.method || null;
        state.lastAuthTime = Date.now();
        state.isLocked = false;
        state.lockReason = null;
      } else {
        state.authMethod = null;
        state.lastAuthTime = 0;
      }
    },
    
    setPasswordSet: (state, action: PayloadAction<boolean>) => {
      state.isPasswordSet = action.payload;
    },
    
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.isBiometricEnabled = action.payload;
    },
    
    setAutoLockEnabled: (state, action: PayloadAction<boolean>) => {
      state.isAutoLockEnabled = action.payload;
    },
    
    setAutoLockTimeout: (state, action: PayloadAction<number>) => {
      state.autoLockTimeout = action.payload;
    },
    
    setLocked: (state, action: PayloadAction<{ 
      isLocked: boolean; 
      reason?: 'timeout' | 'manual' | 'app_background';
    }>) => {
      state.isLocked = action.payload.isLocked;
      state.lockReason = action.payload.reason || null;
      
      if (action.payload.isLocked) {
        state.isAuthenticated = false;
        state.authMethod = null;
      }
    },
    
    updateLastAuthTime: (state) => {
      state.lastAuthTime = Date.now();
    },
    
    resetAuth: (state) => {
      return {
        ...initialState,
        isPasswordSet: state.isPasswordSet, // Keep password status
        isBiometricEnabled: state.isBiometricEnabled, // Keep biometric status
        autoLockTimeout: state.autoLockTimeout, // Keep user preferences
        isAutoLockEnabled: state.isAutoLockEnabled,
      };
    },
  },
});

export const {
  setAuthenticated,
  setPasswordSet,
  setBiometricEnabled,
  setAutoLockEnabled,
  setAutoLockTimeout,
  setLocked,
  updateLastAuthTime,
  resetAuth,
} = authSlice.actions;

export default authSlice.reducer;
