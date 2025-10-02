import React from 'react';
import Tooltip, { type TooltipProps } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { useTheme } from '../contexts/ThemeContext';

interface EnhancedTooltipProps extends Omit<TooltipProps, 'title'> {
  title: string;
  shortcut?: string;
  description?: string;
}

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    fontSize: '12px',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${theme.palette.grey[800]}`,
    maxWidth: 220,
    '&[data-popper-placement*="right"]': {
      marginLeft: '8px',
      '&::before': {
        backgroundColor: theme.palette.grey[900],
        border: `1px solid ${theme.palette.grey[800]}`,
      },
    },
  },
  '& .MuiTooltip-arrow': {
    color: theme.palette.grey[900],
    '&::before': {
      backgroundColor: theme.palette.grey[900],
      border: `1px solid ${theme.palette.grey[800]}`,
    },
  },
}));

const TooltipContent: React.FC<{ title: string; shortcut?: string; description?: string }> = ({
  title,
  shortcut,
  description,
}) => (
  <div className="tooltip-content">
    <div className="flex items-center justify-between gap-2">
      <span className="font-medium">{title}</span>
      {shortcut && (
        <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white bg-opacity-20 rounded border border-white border-opacity-30">
          {shortcut}
        </kbd>
      )}
    </div>
    {description && (
      <div className="mt-1 text-[11px] text-gray-300 leading-relaxed">
        {description}
      </div>
    )}
  </div>
);

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  title,
  shortcut,
  description,
  children,
  placement = 'top',
  arrow = true,
  enterDelay = 700,
  leaveDelay = 0,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  return (
    <StyledTooltip
      title={<TooltipContent title={title} shortcut={shortcut} description={description} />}
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      {...props}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: isDarkMode ? 'grey.800' : 'grey.900',
            '& .MuiTooltip-arrow::before': {
              backgroundColor: isDarkMode ? 'grey.800' : 'grey.900',
            },
          },
        },
        ...props.componentsProps,
      }}
    >
      <span className="tooltip-trigger">{children}</span>
    </StyledTooltip>
  );
};