import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';
import { useTour } from './TourProvider';
import { getTourStyles } from './tourStyles';
import { useTheme } from '../../contexts/ThemeContext';

const HOME_TOUR_ID = 'home-tour';

const homeSteps: Step[] = [
  {
    target: 'body',
    content: 'PowerTimeline helps you visualize history, tell stories, and connect events across time. Let\'s explore!',
    placement: 'center',
    disableBeacon: true,
    title: '👋 Welcome to PowerTimeline',
  },
  {
    target: '[data-tour="my-timelines"]',
    content: '**At the top of the page**, this is your personal workspace. All the timelines you create will appear here.',
    placement: 'bottom',
    title: '📚 My Timelines',
  },
  {
    target: '[data-tour="timeline-card"]',
    content: 'Each card is a timeline. Click to open it in the editor. The three-dot menu has options like delete and export.',
    placement: 'bottom',
    title: '🎴 Timeline Cards',
  },
  {
    target: '[data-tour="browse-public"]',
    content: '**Scroll down to find** public timelines created by other users. Find inspiration or fork one to create your own version.',
    placement: 'bottom',
    title: '🌍 Explore Public Timelines',
  },
  {
    target: '[data-tour="nav-rail"]',
    content: 'Use this **left sidebar** for quick navigation. Browse timelines, access your collection, adjust settings, or start a tour anytime.',
    placement: 'right',
    title: '🧭 Navigation',
  },
];

export const HomePageTour: React.FC = () => {
  const { activeTour, endTour, markTourCompleted } = useTour();
  const { isDarkMode } = useTheme();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      markTourCompleted(HOME_TOUR_ID);
      endTour();
    }
  };

  if (activeTour !== HOME_TOUR_ID) {
    return null;
  }

  return (
    <Joyride
      steps={homeSteps}
      continuous
      showProgress
      showSkipButton
      styles={getTourStyles(isDarkMode)}
      callback={handleJoyrideCallback}
      run={true}
    />
  );
};
