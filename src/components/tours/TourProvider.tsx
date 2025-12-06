import React, { createContext, useContext, useState, useCallback } from 'react';

interface TourContextType {
  startTour: (tourId: string) => void;
  endTour: () => void;
  activeTour: string | null;
  isTourCompleted: (tourId: string) => boolean;
  markTourCompleted: (tourId: string) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_COMPLETED_PREFIX = 'tour-completed-';

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTour, setActiveTour] = useState<string | null>(null);

  const startTour = useCallback((tourId: string) => {
    setActiveTour(tourId);
  }, []);

  const endTour = useCallback(() => {
    setActiveTour(null);
  }, []);

  const isTourCompleted = useCallback((tourId: string): boolean => {
    return localStorage.getItem(`${TOUR_COMPLETED_PREFIX}${tourId}`) === 'true';
  }, []);

  const markTourCompleted = useCallback((tourId: string) => {
    localStorage.setItem(`${TOUR_COMPLETED_PREFIX}${tourId}`, 'true');
  }, []);

  const value: TourContextType = {
    startTour,
    endTour,
    activeTour,
    isTourCompleted,
    markTourCompleted,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
