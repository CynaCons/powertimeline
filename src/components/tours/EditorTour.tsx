import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';
import { useTour } from './TourProvider';
import { tourStyles } from './tourStyles';

const EDITOR_TOUR_ID = 'editor-tour';

const editorSteps: Step[] = [
  {
    target: 'body',
    content: "Welcome to the Timeline Editor! Let's take a quick tour.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="zoom-controls"]',
    content: 'Use scroll wheel or these buttons to zoom in/out.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="timeline-axis"]',
    content: 'Click anywhere on the axis to add events. Drag to pan.',
    placement: 'top',
  },
  {
    target: '[data-tour="event-card"]',
    content: 'Click events to view details. Drag to reposition.',
    placement: 'top',
  },
  {
    target: '[data-tour="minimap"]',
    content: 'The minimap shows your full timeline. Click to jump.',
    placement: 'top',
  },
  {
    target: '[data-tour="add-event"]',
    content: 'Ready to add events? Click here to get started!',
    placement: 'bottom',
  },
  {
    target: '[data-tour="event-editor"]',
    content: 'Edit event details here - title, date, description.',
    placement: 'left',
  },
  {
    target: '[data-tour="stream-view"]',
    content: 'Stream View shows events in a mobile-friendly list.',
    placement: 'bottom',
  },
];

export const EditorTour: React.FC = () => {
  const { activeTour, endTour, markTourCompleted } = useTour();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      markTourCompleted(EDITOR_TOUR_ID);
      endTour();
    }
  };

  if (activeTour !== EDITOR_TOUR_ID) {
    return null;
  }

  return (
    <Joyride
      steps={editorSteps}
      continuous
      showProgress
      showSkipButton
      styles={tourStyles}
      callback={handleJoyrideCallback}
      run={true}
    />
  );
};
