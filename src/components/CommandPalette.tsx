import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useFocusTrap } from '../app/hooks/useFocusTrap';

export interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  category?: string;
  action: () => void;
  aliases?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  placeholder?: string;
}

// Fuzzy search implementation
const fuzzySearch = (query: string, commands: Command[]): Command[] => {
  if (!query.trim()) return commands;

  const searchQuery = query.toLowerCase();

  return commands
    .map(command => {
      let score = 0;
      const title = command.title.toLowerCase();
      const description = command.description?.toLowerCase() || '';
      const aliases = command.aliases?.join(' ').toLowerCase() || '';
      const searchText = `${title} ${description} ${aliases}`;

      // Exact match gets highest score
      if (title.includes(searchQuery)) {
        score += 100;
      }

      // Description match
      if (description.includes(searchQuery)) {
        score += 50;
      }

      // Aliases match
      if (aliases.includes(searchQuery)) {
        score += 75;
      }

      // Fuzzy matching for individual characters
      let queryIndex = 0;
      for (let i = 0; i < searchText.length && queryIndex < searchQuery.length; i++) {
        if (searchText[i] === searchQuery[queryIndex]) {
          score += 1;
          queryIndex++;
        }
      }

      // Bonus for matching all characters
      if (queryIndex === searchQuery.length) {
        score += 20;
      }

      return { command, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ command }) => command);
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  placeholder = 'Type a command or search...',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Enable focus trap when modal is open
  useFocusTrap(isOpen, dialogRef.current);

  // Filter and sort commands based on query
  const filteredCommands = useMemo(() => {
    return fuzzySearch(query, commands).slice(0, 10); // Limit to 10 results
  }, [query, commands]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Keyboard navigation
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'ArrowDown',
        action: () => {
          if (filteredCommands.length > 0) {
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          }
        },
        description: 'Move down',
      },
      {
        key: 'ArrowUp',
        action: () => {
          if (filteredCommands.length > 0) {
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          }
        },
        description: 'Move up',
      },
      {
        key: 'Enter',
        action: () => {
          const selectedCommand = filteredCommands[selectedIndex];
          if (selectedCommand) {
            selectedCommand.action();
            onClose();
          }
        },
        description: 'Execute command',
      },
      {
        key: 'Escape',
        action: onClose,
        description: 'Close palette',
      },
    ],
    disabled: !isOpen,
  });

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleCommandClick = (command: Command) => {
    command.action();
    onClose();
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'navigation': return 'navigation';
      case 'create': return 'add_circle';
      case 'view': return 'visibility';
      case 'theme': return 'palette';
      case 'dev': return 'code';
      default: return 'bolt';
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="command-palette-title"
      aria-describedby="command-palette-description"
      data-keyboard-trap="true"
      closeAfterTransition
    >
      <Fade in={isOpen}>
        <Box
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          sx={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90vw', sm: '600px' },
            maxHeight: '70vh',
            bgcolor: 'background.paper',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header with search input */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span className="material-symbols-rounded text-secondary" aria-hidden="true">search</span>
            <InputBase
              ref={inputRef}
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                flex: 1,
                fontSize: '16px',
                '& input': {
                  padding: 0,
                },
              }}
              autoComplete="off"
              spellCheck={false}
              aria-label="Search commands"
            />
            <Typography variant="caption" color="text.secondary" aria-live="polite" aria-atomic="true">
              {filteredCommands.length} {filteredCommands.length === 1 ? 'result' : 'results'}
            </Typography>
          </Box>
          {/* Screen reader labels */}
          <h2 id="command-palette-title" className="sr-only">Command Palette</h2>
          <div id="command-palette-description" className="sr-only">
            Use arrow keys to navigate, Enter to execute, Escape to close
          </div>

          {/* Commands list */}
          <List
            ref={listRef}
            sx={{
              maxHeight: '400px',
              overflowY: 'auto',
              py: 1,
            }}
          >
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command, index) => (
                <ListItem
                  key={command.id}
                  onClick={() => handleCommandClick(command)}
                  sx={{
                    mx: 1,
                    borderRadius: '8px',
                    mb: 0.5,
                    cursor: 'pointer',
                    bgcolor: index === selectedIndex ? 'primary.50' : 'transparent',
                    '&:hover': {
                      bgcolor: index === selectedIndex ? 'primary.100' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    <span className="material-symbols-rounded text-lg" aria-hidden="true">
                      {command.icon || getCategoryIcon(command.category)}
                    </span>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={500}>
                          {command.title}
                        </Typography>
                        {command.shortcut && (
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded border">
                            {command.shortcut}
                          </kbd>
                        )}
                      </Box>
                    }
                    secondary={command.description}
                  />
                </ListItem>
              ))
            ) : query ? (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No commands found for "{query}"
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Start typing to search commands...
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>

          {/* Footer with help text */}
          <Box
            sx={{
              px: 2,
              py: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Use ↑↓ to navigate, Enter to select, Esc to close
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded">
                Ctrl+K
              </kbd>
              <Typography variant="caption" color="text.secondary">
                to open
              </Typography>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};