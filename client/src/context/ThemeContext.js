import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../styles/theme';

const ThemeContext = createContext();

const initialState = {
  theme: 'dark', // По умолчанию темная тема
  isDark: true,
  isLoading: false,
  error: null,
};

const themeReducer = (state, action) => {
  switch (action.type) {
  case 'SET_THEME':
    return {
      ...state,
      theme: action.payload,
      isDark: action.payload === 'dark',
      error: null,
    };
  case 'TOGGLE_THEME': {
    const newTheme = state.isDark ? 'light' : 'dark';
    return {
      ...state,
      theme: newTheme,
      isDark: !state.isDark,
      error: null,
    };
  }
  case 'SET_LOADING':
    return {
      ...state,
      isLoading: action.payload,
    };
  case 'SET_ERROR':
    return {
      ...state,
      error: action.payload,
      isLoading: false,
    };
  case 'CLEAR_ERROR':
    return {
      ...state,
      error: null,
    };
  default:
    return state;
  }
};

export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Инициализация темы при загрузке
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Проверяем сохраненную тему в localStorage
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          dispatch({ type: 'SET_THEME', payload: savedTheme });
        } else {
          // Проверяем системные настройки
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          dispatch({ type: 'SET_THEME', payload: systemTheme });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Ошибка инициализации темы' });
      }
    };

    initializeTheme();
  }, []);

  // Слушаем изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      // Обновляем тему только если пользователь не выбрал конкретную тему
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        const systemTheme = e.matches ? 'dark' : 'light';
        dispatch({ type: 'SET_THEME', payload: systemTheme });
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem('theme', state.theme);

      // Обновляем класс на body для глобальных стилей
      document.body.className = state.isDark ? 'dark-theme' : 'light-theme';

      // Обновляем meta тег для цвета статус-бара на мобильных устройствах
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', state.isDark ? '#0F1419' : '#FFFFFF');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Ошибка сохранения темы' });
    }
  }, [state.theme, state.isDark]);

  // Функция для переключения темы
  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  // Функция для установки конкретной темы
  const setTheme = (theme) => {
    if (theme === 'light' || theme === 'dark') {
      dispatch({ type: 'SET_THEME', payload: theme });
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'Неверная тема' });
    }
  };

  // Функция для сброса темы к системной
  const resetToSystemTheme = () => {
    try {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      dispatch({ type: 'SET_THEME', payload: systemTheme });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Ошибка сброса темы' });
    }
  };

  // Функция для очистки ошибок
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Получение текущей темы для styled-components
  const currentTheme = state.isDark ? darkTheme : lightTheme;

  const value = {
    ...state,
    toggleTheme,
    setTheme,
    resetToSystemTheme,
    clearError,
    currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={currentTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Хук для получения только функций управления темой
export const useThemeActions = () => {
  const { toggleTheme, setTheme, resetToSystemTheme, clearError } = useTheme();
  return { toggleTheme, setTheme, resetToSystemTheme, clearError };
};

// Хук для получения только состояния темы
export const useThemeState = () => {
  const { theme, isDark, isLoading, error, currentTheme } = useTheme();
  return { theme, isDark, isLoading, error, currentTheme };
};

// Утилитарные функции
export const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const getSavedTheme = () => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const saveTheme = (theme) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('theme', theme);
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
};

export default ThemeContext;
