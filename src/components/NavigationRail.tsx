import React, { useRef, useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import { EnhancedTooltip } from './EnhancedTooltip';
import { useTheme } from '../contexts/ThemeContext';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
  color?: string;
}

export interface NavigationSection {
  type: 'global' | 'context' | 'utilities';
  title?: string;  // Optional section title
  collapsible?: boolean;  // Whether section can be collapsed
  defaultCollapsed?: boolean;  // Default collapse state
  items: NavigationItem[];
}

interface NavigationRailProps {
  items?: NavigationItem[];  // Legacy support
  sections?: NavigationSection[];  // New sectioned format
  activeItemId?: string;
  onKeyboardNavigation?: (direction: 'up' | 'down') => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  items,
  sections,
  activeItemId,
  onKeyboardNavigation
}) => {
  const railRef = useRef<HTMLDivElement>(null);

  // Support legacy items array or new sections array
  const displaySections: NavigationSection[] = sections || (items ? [{ type: 'global', items }] : []);

  // State for collapsed sections (persisted in localStorage)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('nav_rail_collapsed_sections');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    // Initialize with default collapse states
    const initial: Record<string, boolean> = {};
    displaySections.forEach((section, index) => {
      if (section.collapsible && section.defaultCollapsed) {
        initial[`${section.type}-${index}`] = true;
      }
    });
    return initial;
  });

  // Persist collapsed state to localStorage
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => {
      const newState = { ...prev, [sectionKey]: !prev[sectionKey] };
      localStorage.setItem('nav_rail_collapsed_sections', JSON.stringify(newState));
      return newState;
    });
  };

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
    const isActive = item.id === activeItemId || item.isActive;
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
      {displaySections.map((section, sectionIndex) => {
        const sectionKey = `${section.type}-${sectionIndex}`;
        const isCollapsed = section.collapsible && collapsedSections[sectionKey];

        return (
          <React.Fragment key={sectionKey}>
            {/* Section title and collapse button (if collapsible) */}
            {section.collapsible && section.title && (
              <EnhancedTooltip
                title={isCollapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
                placement="right"
              >
                <IconButton
                  size="small"
                  onClick={() => toggleSection(sectionKey)}
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                  aria-label={isCollapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
                  aria-expanded={!isCollapsed}
                >
                  <span className="material-symbols-rounded text-sm">
                    {isCollapsed ? 'chevron_right' : 'expand_more'}
                  </span>
                </IconButton>
              </EnhancedTooltip>
            )}

            {/* Section items (hidden when collapsed) */}
            {!isCollapsed && section.items.map((item, itemIndex) => (
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
                  data-testid={`nav-${item.id}`}
                  data-nav-index={itemIndex}
                  data-section={section.type}
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

            {/* Separator between sections (not after last section) */}
            {sectionIndex < displaySections.length - 1 && (
              <div
                className="w-8 h-px bg-gray-300 my-2"
                role="separator"
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
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