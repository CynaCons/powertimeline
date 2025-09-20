import { useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeManagerReturn {
  toggleTheme: () => void;
  currentTheme: string;
  isDarkMode: boolean;
  isLightMode: boolean;
  isSystemMode: boolean;
}

export function useThemeManager(): ThemeManagerReturn {
  const { themePreference, toggleTheme } = useTheme();

  const handleToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const isDarkMode = themePreference === 'dark';
  const isLightMode = themePreference === 'light';
  const isSystemMode = themePreference === 'system';

  return {
    toggleTheme: handleToggle,
    currentTheme: themePreference,
    isDarkMode,
    isLightMode,
    isSystemMode
  };
}