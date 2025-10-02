import React, { useRef, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import { EnhancedTooltip } from './EnhancedTooltip';
import { useTheme } from '../contexts/ThemeContext';

interface NavigationItem {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
  color?: string;
}

interface NavigationRailProps {
  items: NavigationItem[];
  activeItemId?: string;
  onKeyboardNavigation?: (direction: 'up' | 'down') => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  items,
  activeItemId,
  onKeyboardNavigation
}) => {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if focus is within the navigation rail
      if (!railRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onKeyboardNavigation?.('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          onKeyboardNavigation?.('down');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onKeyboardNavigation]);

  const getButtonStyles = (item: NavigationItem) => {
    const isActive = item.id === activeItemId;
    return {
      bgcolor: isActive ? 'grey.900' : undefined,
      color: isActive ? 'common.white' : item.color || 'text.primary',
      position: 'relative',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'scale(1)',
      '&:hover': {
        bgcolor: isActive ? 'grey.800' : item.color ? `${item.color}.50` : 'grey.100',
        transform: 'scale(1.05)',
      },
      '&:focus-visible': {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: '2px',
        borderRadius: '8px',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
      // Active state indicator
      '&::before': isActive ? {
        content: '""',
        position: 'absolute',
        left: '-8px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '3px',
        height: '20px',
        backgroundColor: 'primary.main',
        borderRadius: '2px',
        opacity: 1,
        transition: 'opacity 0.3s ease',
      } : {},
    } as const;
  };

  return (
    <div
      ref={railRef}
      className="flex flex-col items-center gap-2 mb-auto navigation-rail"
      role="navigation"
      aria-label="Main navigation"
    >
      {items.map((item, index) => (
        <EnhancedTooltip
          key={item.id}
          title={item.label}
          shortcut={item.shortcut}
          placement="right"
        >
          <IconButton
            aria-label={item.label}
            size="small"
            onClick={item.onClick}
            sx={getButtonStyles(item)}
            className="nav-button"
            data-nav-index={index}
            tabIndex={0}
          >
            {typeof item.icon === 'string' ? (
              <span className="material-symbols-rounded nav-icon">
                {item.icon}
              </span>
            ) : (
              item.icon
            )}
          </IconButton>
        </EnhancedTooltip>
      ))}
    </div>
  );
};

// Utility component for theme toggle button
export const ThemeToggleButton: React.FC = () => {
  const { isDarkMode, toggleTheme, themePreference } = useTheme();

  const getThemeIcon = () => {
    if (themePreference === 'system') return 'auto_mode';
    return isDarkMode ? 'light_mode' : 'dark_mode';
  };

  const getThemeTitle = () => {
    switch (themePreference) {
      case 'light': return 'Switch to dark mode';
      case 'dark': return 'Switch to light mode';
      case 'system': return 'Using system theme, click to toggle';
      default: return 'Toggle theme';
    }
  };

  return (
    <EnhancedTooltip title="Theme" shortcut="Alt+T" placement="right">
      <button
        type="button"
        title={getThemeTitle()}
        onClick={toggleTheme}
        className={`material-symbols-rounded rounded-md p-2 transition-theme ${
          isDarkMode
            ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            : 'text-secondary hover:bg-surface-elevated'
        }`}
        aria-label="Toggle theme"
      >
        {getThemeIcon()}
      </button>
    </EnhancedTooltip>
  );
};