import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userId: number | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    userId: null,
  });

  useEffect(() => {
    // Load auth state from storage on mount
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userId = await AsyncStorage.getItem('user_id');
      
      setAuthState({
        token,
        isAuthenticated: !!token,
        userId: userId ? parseInt(userId) : null,
      });
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  };

  const login = async (token: string, userId: number) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_id', userId.toString());
      
      setAuthState({
        token,
        isAuthenticated: true,
        userId,
      });
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_id');
      
      setAuthState({
        token: null,
        isAuthenticated: false,
        userId: null,
      });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  return {
    ...authState,
    login,
    logout,
  };
}; 