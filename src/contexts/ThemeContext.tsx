import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themePreference: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false, // Default to light mode
  toggleTheme: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  setTheme: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  themePreference: 'light'
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ChronoThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get initial theme preference from localStorage or default to light
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem('theme-preference');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (error) {
      console.warn('Failed to read theme preference from localStorage:', error);
    }
    return 'light'; // Default to light mode
  });

  // Track system preference
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Calculate actual theme based on preference
  const isDarkMode = themePreference === 'dark' ||
    (themePreference === 'system' && systemPrefersDark);

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    // Use addEventListener for modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  // Apply theme to DOM and save preference
  useEffect(() => {
    // Apply data-theme attribute to html element
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

    // Save preference to localStorage
    try {
      localStorage.setItem('theme-preference', themePreference);
    } catch (error) {
      console.warn('Failed to save theme preference to localStorage:', error);
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? '#121212' : '#FAFAFA');
    } else {
      // Create meta tag if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = isDarkMode ? '#121212' : '#FAFAFA';
      document.head.appendChild(meta);
    }
  }, [isDarkMode, themePreference]);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
  };

  const toggleTheme = () => {
    if (themePreference === 'system') {
      // If currently on system, toggle to the opposite of system preference
      setThemePreference(systemPrefersDark ? 'light' : 'dark');
    } else if (themePreference === 'light') {
      setThemePreference('dark');
    } else {
      setThemePreference('light');
    }
  };

  // Provide theme information to components
  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    setTheme,
    themePreference
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ChronoThemeProvider');
  }
  return context;
};

// Hook to get theme-aware class names
export const useThemeClasses = () => {
  const { isDarkMode } = useTheme();

  return {
    isDarkMode,
    surface: isDarkMode ? 'bg-surface-elevated' : 'bg-surface',
    background: 'bg-background',
    textPrimary: 'text-primary',
    textSecondary: 'text-secondary',
    borderPrimary: 'border-primary',
    shadowMd: isDarkMode ? 'shadow-lg' : 'shadow-md'
  };
};