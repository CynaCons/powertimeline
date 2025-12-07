import type { Styles } from 'react-joyride';

export const getTourStyles = (isDarkMode: boolean): Partial<Styles> => {
  return {
    options: {
      primaryColor: '#8b5cf6',
      zIndex: 10000,
      overlayColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
      arrowColor: isDarkMode ? '#1e1e2e' : '#ffffff',
      backgroundColor: isDarkMode ? '#1e1e2e' : '#ffffff',
      textColor: isDarkMode ? '#e6edf3' : '#212529',
      spotlightShadow: isDarkMode
        ? '0 0 30px rgba(139, 92, 246, 0.5)'
        : '0 0 30px rgba(139, 92, 246, 0.3)',
    },
    tooltip: {
      borderRadius: 12,
      padding: 20,
      boxShadow: isDarkMode
        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)'
        : '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.2)',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipTitle: {
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 8,
      color: isDarkMode ? '#e6edf3' : '#212529',
    },
    tooltipContent: {
      fontSize: 14,
      lineHeight: 1.6,
      color: isDarkMode ? '#a1a1aa' : '#6c757d',
    },
    buttonNext: {
      backgroundColor: '#8b5cf6',
      borderRadius: 8,
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 500,
    },
    buttonBack: {
      color: '#8b5cf6',
      marginRight: 10,
    },
    buttonSkip: {
      color: isDarkMode ? '#71717a' : '#6c757d',
    },
    spotlight: {
      borderRadius: 8,
    },
  };
};
