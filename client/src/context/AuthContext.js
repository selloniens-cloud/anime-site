import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
  case 'AUTH_START':
    return { ...state, isLoading: true, error: null };
  case 'AUTH_SUCCESS':
    return {
      ...state,
      user: action.payload,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
  case 'AUTH_FAILURE':
    return {
      ...state,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: action.payload,
    };
  case 'LOGOUT':
    return {
      ...state,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  case 'UPDATE_USER':
    return {
      ...state,
      user: { ...state.user, ...action.payload },
    };
  default:
    return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAILURE', payload: error.message });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    console.log('🔍 CLIENT LOGIN DEBUG - Credentials:', credentials);
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(credentials);
      console.log('🔍 CLIENT LOGIN DEBUG - Response:', response);
      const { user, tokens } = response.data;
      localStorage.setItem('token', tokens.accessToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return { success: true };
    } catch (error) {
      console.log('🔍 CLIENT LOGIN DEBUG - Error:', error);
      console.log('🔍 CLIENT LOGIN DEBUG - Error response:', error.response);
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.register(userData);
      const { user, tokens } = response.data;
      localStorage.setItem('token', tokens.accessToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
