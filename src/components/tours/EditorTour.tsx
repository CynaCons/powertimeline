import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';
import { useTour } from './TourProvider';
import { getTourStyles } from './tourStyles';
import { useTheme } from '../../contexts/ThemeContext';

const EDITOR_TOUR_ID = 'editor-tour';

const editorSteps: Step[] = [
  {
    target: 'body',
    content: 'This is where you build and explore timelines. Navigate through time, add events, and see the big picture.',
    placement: 'center',
    disableBeacon: true,
    title: '👋 Welcome to the Editor',
  },
  {
    target: '[data-tour="zoom-controls"]',
    content: 'Scroll your mouse wheel to zoom in and out. The timeline adapts its scale from centuries down to individual days.',
    placement: 'bottom',
    title: '🔍 Zoom Controls',
  },
  {
    target: '[data-tour="timeline-axis"]',
    content: 'This is your timeline axis. It shows the current time range and scale. Drag left or right to pan through time.',
    placement: 'top',
    title: '📅 Timeline Axis',
  },
  {
    target: '[data-tour="event-card"]',
    content: 'Each card represents an event. Click to select it and view its details in the editor panel.',
    placement: 'top',
    title: '📌 Event Cards',
  },
  {
    target: '[data-tour="minimap"]',
    content: 'The minimap gives you a bird\'s-eye view. The highlighted area shows where you are. Click anywhere to jump.',
    placement: 'top',
    title: '🗺️ Minimap',
  },
  {
    target: '[data-tour="add-event"]',
    content: 'Add new events to your timeline here. You\'ll set the title, date, and description.',
    placement: 'bottom',
    title: '➕ Add Events',
  },
  {
    target: '[data-tour="event-editor"]',
    content: 'This panel shows the selected event\'s details. Edit the title, dates, description, and sources here.',
    placement: 'left',
    title: '✏️ Event Editor',
  },
  {
    target: '[data-tour="stream-view"]',
    content: 'Switch to Stream View for a chronological list format. Great for reading through events in order.',
    placement: 'bottom',
    title: '📜 Stream View',
  },
];

export const EditorTour: React.FC = () => {
  const { activeTour, endTour, markTourCompleted } = useTour();
  const { isDarkMode } = useTheme();

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
      styles={getTourStyles(isDarkMode)}
      callback={handleJoyrideCallback}
      run={true}
    />
  );
};
