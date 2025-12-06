import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';
import { useTour } from './TourProvider';
import { tourStyles } from './tourStyles';

const HOME_TOUR_ID = 'home-tour';

const homeSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to PowerTimeline! Let\'s show you around the home page.',
    placement: 'center',
    disableBeacon: true,
    title: 'Welcome!',
  },
  {
    target: '[data-tour="my-timelines"]',
    content: 'Your personal timelines appear here. Create, edit, and manage your work.',
    placement: 'bottom',
    title: 'My Timelines',
  },
  {
    target: '[data-tour="timeline-card"]',
    content: 'Click any timeline card to open it. Use the menu for more options.',
    placement: 'bottom',
    title: 'Timeline Cards',
  },
  {
    target: '[data-tour="browse-public"]',
    content: 'Explore timelines created by others. Fork them to make your own versions.',
    placement: 'top',
    title: 'Browse Public',
  },
  {
    target: '[data-tour="nav-rail"]',
    content: 'Use the navigation rail to switch between Browse, My Timelines, and Settings.',
    placement: 'right',
    title: 'Navigation',
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
