import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

export interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  maxItems = 4,
  className,
}) => {
  if (items.length === 0) return null;

  const handleKeyDown = (event: React.KeyboardEvent, item: BreadcrumbItem) => {
    if ((event.key === 'Enter' || event.key === ' ') && item.onClick) {
      event.preventDefault();
      item.onClick();
    }
  };

  const renderBreadcrumbItem = (item: BreadcrumbItem, isLast: boolean) => {
    const content = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {item.icon && (
          <span
            className="material-symbols-rounded"
            style={{ fontSize: '16px', opacity: 0.7 }}
          >
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
      </Box>
    );

    if (isLast || !item.onClick || item.disabled) {
      return (
        <Typography
          key={item.id}
          color={isLast ? 'text.primary' : 'text.secondary'}
          sx={{
            fontSize: '14px',
            fontWeight: isLast ? 500 : 400,
            display: 'flex',
            alignItems: 'center',
            opacity: item.disabled ? 0.5 : 1,
          }}
        >
          {content}
        </Typography>
      );
    }

    return (
      <Link
        key={item.id}
        component="button"
        variant="body2"
        color="text.secondary"
        onClick={item.onClick}
        onKeyDown={(e) => handleKeyDown(e, item)}
        sx={{
          fontSize: '14px',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'action.hover',
            color: 'text.primary',
            textDecoration: 'none',
          },
          '&:focus': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: '1px',
          },
        }}
        aria-label={`Navigate to ${item.label}`}
      >
        {content}
      </Link>
    );
  };

  return (
    <Box
      className={`breadcrumb-container ${className || ''}`}
      sx={{
        py: 1,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Breadcrumbs
        aria-label="Navigation breadcrumb"
        separator={
          <NavigateNextIcon
            sx={{
              fontSize: '16px',
              color: 'text.disabled',
              mx: 0.5,
            }}
          />
        }
        maxItems={maxItems}
        itemsBeforeCollapse={1}
        itemsAfterCollapse={2}
        sx={{
          '& .MuiBreadcrumbs-separator': {
            margin: '0 4px',
          },
          '& .MuiBreadcrumbs-li': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {items.map((item, index) =>
          renderBreadcrumbItem(item, index === items.length - 1)
        )}
      </Breadcrumbs>
    </Box>
  );
};

// Hook to manage breadcrumb state
export const useBreadcrumb = (initialItems: BreadcrumbItem[] = []) => {
  const [items, setItems] = React.useState<BreadcrumbItem[]>(initialItems);

  const pushItem = React.useCallback((item: BreadcrumbItem) => {
    setItems(prev => [...prev, item]);
  }, []);

  const popItem = React.useCallback(() => {
    setItems(prev => prev.slice(0, -1));
  }, []);

  const popToItem = React.useCallback((itemId: string) => {
    setItems(prev => {
      const index = prev.findIndex(item => item.id === itemId);
      return index >= 0 ? prev.slice(0, index + 1) : prev;
    });
  }, []);

  const setItems_ = React.useCallback((newItems: BreadcrumbItem[]) => {
    setItems(newItems);
  }, []);

  const clear = React.useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    pushItem,
    popItem,
    popToItem,
    setItems: setItems_,
    clear,
  };
};