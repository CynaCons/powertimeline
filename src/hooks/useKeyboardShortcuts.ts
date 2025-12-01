import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  disabled?: boolean;
}

// Check if current focus is in an input element
const isInputFocused = (): boolean => {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isEditable = activeElement.getAttribute('contenteditable') === 'true';
  const inputTypes = ['input', 'textarea', 'select'];

  return inputTypes.includes(tagName) || isEditable;
};

// Format key combination for display
const formatKeyCombo = (config: ShortcutConfig): string => {
  const parts: string[] = [];

  if (config.ctrlKey) parts.push('Ctrl');
  if (config.metaKey) parts.push('Cmd');
  if (config.altKey) parts.push('Alt');
  if (config.shiftKey) parts.push('Shift');

  parts.push(config.key.toUpperCase());

  return parts.join('+');
};

// Check if event matches shortcut config
const matchesShortcut = (event: KeyboardEvent, config: ShortcutConfig): boolean => {
  const keyMatch = event.key.toLowerCase() === config.key.toLowerCase();
  const ctrlMatch = !!event.ctrlKey === !!config.ctrlKey;
  const metaMatch = !!event.metaKey === !!config.metaKey;
  const altMatch = !!event.altKey === !!config.altKey;
  const shiftMatch = !!event.shiftKey === !!config.shiftKey;

  return keyMatch && ctrlMatch && metaMatch && altMatch && shiftMatch;
};

export const useKeyboardShortcuts = ({ shortcuts, disabled = false }: UseKeyboardShortcutsOptions) => {
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if disabled or input is focused
    if (disabled || isInputFocused()) return;

    // Don't handle if any modal/overlay is open with data-keyboard-trap
    const trapElement = document.querySelector('[data-keyboard-trap="true"]');
    if (trapElement) return;

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.disabled) continue;

      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break; // Only execute first matching shortcut
      }
    }
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown, disabled]);

  // Return formatted shortcuts for display purposes
  const formattedShortcuts = shortcuts.map(config => ({
    ...config,
    combo: formatKeyCombo(config),
  }));

  return {
    shortcuts: formattedShortcuts,
    formatKeyCombo,
  };
};

// Hook for command palette specific shortcuts
export const useCommandPaletteShortcuts = (onOpenPalette: () => void, disabled = false) => {
  return useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        ctrlKey: true,
        action: onOpenPalette,
        description: 'Open command palette',
      },
      {
        key: 'k',
        metaKey: true,
        action: onOpenPalette,
        description: 'Open command palette',
      },
    ],
    disabled,
  });
};

// Hook for navigation specific shortcuts
export const useNavigationShortcuts = (
  actions: {
    openEvents: () => void;
    openCreate: () => void;
    toggleTheme: () => void;
    closeOverlay: () => void;
  },
  disabled = false
) => {
  return useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'e',
        altKey: true,
        action: actions.openEvents,
        description: 'Open Events panel',
      },
      {
        key: 'c',
        altKey: true,
        action: actions.openCreate,
        description: 'Create new event',
      },
      {
        key: 't',
        altKey: true,
        action: actions.toggleTheme,
        description: 'Toggle theme',
      },
      {
        key: 'Escape',
        action: actions.closeOverlay,
        description: 'Close overlay',
      },
    ],
    disabled,
  });
};