import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  // Navigation state
  currentScreen: string;
  previousScreen: string | null;
  navigationParams: Record<string, any>;
  
  // Loading states
  isAppLoading: boolean;
  isInitializing: boolean;
  
  // Modal states
  activeModal: string | null;
  modalParams: Record<string, any>;
  
  // Theme state
  theme: 'light' | 'dark' | 'system';
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    dismissed: boolean;
  }>;
  
  // Bottom navigation
  activeTab: string;
  bottomNavVisible: boolean;
  
  // Screen-specific UI states
  refreshing: boolean;
  searchQuery: string;
  selectedItems: string[];
  
  // App state
  isAppActive: boolean;
  networkConnected: boolean;
  
  // User preferences
  biometricPromptShown: boolean;
  onboardingCompleted: boolean;
  analyticsEnabled: boolean;
}

const initialState: UIState = {
  currentScreen: 'onboarding',
  previousScreen: null,
  navigationParams: {},
  isAppLoading: false,
  isInitializing: true,
  activeModal: null,
  modalParams: {},
  theme: 'system',
  notifications: [],
  activeTab: 'home',
  bottomNavVisible: true,
  refreshing: false,
  searchQuery: '',
  selectedItems: [],
  isAppActive: true,
  networkConnected: true,
  biometricPromptShown: false,
  onboardingCompleted: false,
  analyticsEnabled: true,
};

let notificationIdCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    navigateToScreen: (state, action: PayloadAction<{ 
      screen: string; 
      params?: Record<string, any>;
    }>) => {
      state.previousScreen = state.currentScreen;
      state.currentScreen = action.payload.screen;
      state.navigationParams = action.payload.params || {};
    },
    
    goBack: (state) => {
      if (state.previousScreen) {
        const tempCurrent = state.currentScreen;
        state.currentScreen = state.previousScreen;
        state.previousScreen = tempCurrent;
        state.navigationParams = {};
      }
    },
    
    setAppLoading: (state, action: PayloadAction<boolean>) => {
      state.isAppLoading = action.payload;
    },
    
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
    
    showModal: (state, action: PayloadAction<{ 
      modal: string; 
      params?: Record<string, any>;
    }>) => {
      state.activeModal = action.payload.modal;
      state.modalParams = action.payload.params || {};
    },
    
    hideModal: (state) => {
      state.activeModal = null;
      state.modalParams = {};
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      title: string;
      message: string;
    }>) => {
      const notification = {
        id: `notification_${++notificationIdCounter}`,
        ...action.payload,
        timestamp: Date.now(),
        dismissed: false,
      };
      
      state.notifications.unshift(notification);
      
      // Keep only last 10 notifications
      if (state.notifications.length > 10) {
        state.notifications = state.notifications.slice(0, 10);
      }
    },
    
    dismissNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.dismissed = true;
      }
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    
    setBottomNavVisible: (state, action: PayloadAction<boolean>) => {
      state.bottomNavVisible = action.payload;
    },
    
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setSelectedItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },
    
    toggleSelectedItem: (state, action: PayloadAction<string>) => {
      const item = action.payload;
      const index = state.selectedItems.indexOf(item);
      
      if (index >= 0) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(item);
      }
    },
    
    clearSelectedItems: (state) => {
      state.selectedItems = [];
    },
    
    setAppActive: (state, action: PayloadAction<boolean>) => {
      state.isAppActive = action.payload;
    },
    
    setNetworkConnected: (state, action: PayloadAction<boolean>) => {
      state.networkConnected = action.payload;
    },
    
    setBiometricPromptShown: (state, action: PayloadAction<boolean>) => {
      state.biometricPromptShown = action.payload;
    },
    
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
    
    setAnalyticsEnabled: (state, action: PayloadAction<boolean>) => {
      state.analyticsEnabled = action.payload;
    },
    
    resetUI: () => {
      return initialState;
    },
  },
});

export const {
  navigateToScreen,
  goBack,
  setAppLoading,
  setInitializing,
  showModal,
  hideModal,
  setTheme,
  addNotification,
  dismissNotification,
  clearNotifications,
  setActiveTab,
  setBottomNavVisible,
  setRefreshing,
  setSearchQuery,
  setSelectedItems,
  toggleSelectedItem,
  clearSelectedItems,
  setAppActive,
  setNetworkConnected,
  setBiometricPromptShown,
  setOnboardingCompleted,
  setAnalyticsEnabled,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
