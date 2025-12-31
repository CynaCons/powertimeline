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
  'data-tour'?: string;
  badge?: string; // Optional badge (e.g., checkmark for completed tours)
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

  // Separate utilities section from main sections for bottom rendering
  const mainSections = displaySections.filter(s => s.type !== 'utilities');
  const utilitiesSection = displaySections.find(s => s.type === 'utilities');

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
    const hasCustomColor = item.color && item.color.startsWith('#');
    const accentColor = hasCustomColor ? item.color! : 'var(--page-accent)';
    return {
      backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
      color: isActive ? accentColor : item.color || 'var(--page-text-secondary)',
      position: 'relative',
      boxShadow: 'none',
      transition: 'background-color var(--pt-hover-duration) var(--pt-hover-ease), color var(--pt-hover-duration) var(--pt-hover-ease), transform var(--pt-hover-duration) var(--pt-hover-ease)',
      '&:hover': {
        backgroundColor: 'var(--nav-hover-bg)',
        color: hasCustomColor ? accentColor : 'var(--page-accent)',
      },
      '&:focus-visible': {
        outline: '2px solid',
        outlineColor: 'var(--page-accent)',
        outlineOffset: '2px',
        borderRadius: '8px',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '& .nav-icon': {
        color: 'inherit',
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
        backgroundColor: accentColor,
        borderRadius: '2px',
        opacity: 1,
        transition: 'opacity 0.3s ease',
      } : {},
    } as const;
  };

  const renderSection = (section: NavigationSection, sectionIndex: number, totalSections: number) => {
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
                minWidth: '44px',
                minHeight: '44px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              aria-label={isCollapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
              aria-expanded={!isCollapsed}
            >
              <span className="material-symbols-rounded text-sm" aria-hidden="true">
                {isCollapsed ? 'chevron_right' : 'expand_more'}
              </span>
            </IconButton>
          </EnhancedTooltip>
        )}

        {/* Section items (hidden when collapsed) */}
        {!isCollapsed && section.items.map((item, itemIndex) => {
          const isActive = item.id === activeItemId || item.isActive;
          return (
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
                data-active={isActive ? 'true' : undefined}
                data-nav-index={itemIndex}
                data-section={section.type}
                data-tour={item['data-tour']}
                tabIndex={0}
              >
                {typeof item.icon === 'string' ? (
                  <span className="material-symbols-rounded nav-icon" aria-hidden="true" style={{ fontSize: '24px' }}>
                    {item.icon}
                  </span>
                ) : (
                  item.icon
                )}
              </IconButton>
            </EnhancedTooltip>
          );
        })}

        {/* Separator between sections (not after last section) */}
        {sectionIndex < totalSections - 1 && (
          <div
            className="w-8 h-px my-2"
            style={{ backgroundColor: 'var(--page-border)' }}
            role="separator"
            aria-hidden="true"
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      {/* Main navigation sections */}
      <div
        ref={railRef}
        className="flex flex-col items-center gap-2 navigation-rail"
        role="navigation"
        aria-label="Main navigation"
        data-testid="navigation-rail"
      >
        {mainSections.map((section, sectionIndex) =>
          renderSection(section, sectionIndex, mainSections.length)
        )}
      </div>

      {/* Utilities section at bottom (if present) */}
      {utilitiesSection && (
        <div className="flex flex-col items-center gap-2 mt-auto">
          {utilitiesSection.items.map((item, itemIndex) => {
            const isActive = item.id === activeItemId || item.isActive;
            return (
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
                  data-active={isActive ? 'true' : undefined}
                  data-nav-index={itemIndex}
                  data-section="utilities"
                  data-tour={item['data-tour']}
                  tabIndex={0}
                >
                  {typeof item.icon === 'string' ? (
                    <span className="material-symbols-rounded nav-icon" aria-hidden="true" style={{ fontSize: '24px' }}>
                      {item.icon}
                    </span>
                  ) : (
                    item.icon
                  )}
                </IconButton>
              </EnhancedTooltip>
            );
          })}
        </div>
      )}
    </>
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
        className="material-symbols-rounded rounded-md p-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          color: 'var(--page-text-secondary)',
          backgroundColor: 'transparent',
          outlineColor: 'var(--page-accent)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--page-accent)';
          e.currentTarget.style.color = 'var(--page-accent-contrast-text, #ffffff)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--page-text-secondary)';
        }}
        aria-label="Toggle theme"
        data-testid="btn-theme-toggle"
      >
        <span aria-hidden="true">{getThemeIcon()}</span>
      </button>
    </EnhancedTooltip>
  );
};
