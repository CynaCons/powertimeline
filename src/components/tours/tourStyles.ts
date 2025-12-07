import type { Styles } from 'react-joyride';

export const tourStyles: Partial<Styles> = {
  options: {
    primaryColor: '#8b5cf6',
    zIndex: 10000,
    overlayColor: 'rgba(0, 0, 0, 0.8)',
    arrowColor: '#1e1e2e',
    backgroundColor: '#1e1e2e',
    textColor: '#e6edf3',
    spotlightShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
  },
  tooltip: {
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)',
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
    color: '#e6edf3',
  },
  tooltipContent: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#a1a1aa',
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
    color: '#71717a',
  },
  spotlight: {
    borderRadius: 8,
  },
};
