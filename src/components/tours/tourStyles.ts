import type { Styles } from 'react-joyride';

export const tourStyles: Partial<Styles> = {
  options: {
    primaryColor: '#8b5cf6',
    zIndex: 10000,
    overlayColor: 'rgba(0, 0, 0, 0.75)',
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  buttonNext: {
    backgroundColor: '#8b5cf6',
  },
  buttonBack: {
    color: '#8b5cf6',
  },
};
