import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';
import { useTour } from './TourProvider';
import { tourStyles } from './tourStyles';

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
    content: 'This is your personal workspace. All the timelines you create will appear here.',
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
    content: 'Discover timelines created by other users. Find inspiration or fork one to create your own version.',
    placement: 'top',
    title: '🌍 Explore Public Timelines',
  },
  {
    target: '[data-tour="nav-rail"]',
    content: 'Quick navigation lives here. Browse timelines, access your collection, adjust settings, or start a tour anytime.',
    placement: 'right',
    title: '🧭 Navigation',
  },
];

export const HomePageTour: React.FC = () => {
  const { activeTour, endTour, markTourCompleted } = useTour();

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
      styles={tourStyles}
      callback={handleJoyrideCallback}
      run={true}
    />
  );
};
