import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './index';
import { initializeWallet } from './slices/walletSlice';
import { setInitializing } from './slices/uiSlice';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Redux Provider component
export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <AppInitializer>
        {children}
      </AppInitializer>
    </Provider>
  );
};

// App initializer component that runs inside Redux context
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const isInitializing = useAppSelector((state: any) => state.ui.isInitializing);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch(setInitializing(true));
        
        // Initialize wallet state
        await dispatch(initializeWallet()).unwrap();
        
        // Add any other initialization logic here
        console.log('✅ Redux store initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Redux store:', error);
      } finally {
        dispatch(setInitializing(false));
      }
    };

    initializeApp();
  }, [dispatch]);

  return <>{children}</>;
};

export default ReduxProvider;
