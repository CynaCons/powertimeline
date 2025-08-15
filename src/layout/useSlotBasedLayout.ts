import { useState, useEffect, useMemo, useCallback } from 'react';
import { Event } from '../types';
import { LayoutEngine } from './LayoutEngine';
import { LayoutResult, LayoutConfig } from './types';
import { createLayoutConfig, getViewportSpecificConfig } from './config';

interface UseSlotBasedLayoutProps {
  events: Event[];
  viewStart: Date;
  viewEnd: Date;
  viewportWidth: number;
  viewportHeight: number;
  customConfig?: Partial<LayoutConfig>;
}

export function useSlotBasedLayout({
  events,
  viewStart,
  viewEnd,
  viewportWidth,
  viewportHeight,
  customConfig
}: UseSlotBasedLayoutProps) {
  
  // Create layout configuration
  const config = useMemo(() => {
    const viewportConfig = getViewportSpecificConfig(viewportWidth, viewportHeight);
    return createLayoutConfig(viewportWidth, viewportHeight, {
      ...viewportConfig,
      ...customConfig
    });
  }, [viewportWidth, viewportHeight, customConfig]);

  // Create layout engine
  const layoutEngine = useMemo(() => {
    return new LayoutEngine(config);
  }, [config]);

  // Layout state
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  // Perform layout calculation
  const performLayout = useCallback(async () => {
    if (events.length === 0) {
      setLayoutResult({
        positionedCards: [],
        clusters: [],
        anchors: [],
        utilization: { totalSlots: 0, usedSlots: 0, percentage: 0 }
      });
      return;
    }

    setIsLayouting(true);
    setLayoutError(null);

    try {
      // Use setTimeout to prevent blocking the UI thread
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const result = layoutEngine.layoutEvents(events, viewStart, viewEnd);
      
      // Validate layout
      const validation = layoutEngine.validateLayout(result, events);
      if (!validation.isValid) {
        console.warn('Layout validation issues:', validation.issues);
        setLayoutError(`Layout issues: ${validation.issues.join(', ')}`);
      }
      
      setLayoutResult(result);
    } catch (error) {
      console.error('Layout calculation failed:', error);
      setLayoutError(error instanceof Error ? error.message : 'Unknown layout error');
    } finally {
      setIsLayouting(false);
    }
  }, [events, viewStart, viewEnd, layoutEngine]);

  // Trigger layout when dependencies change
  useEffect(() => {
    performLayout();
  }, [performLayout]);

  // Handle zoom changes
  const handleZoom = useCallback((newViewStart: Date, newViewEnd: Date) => {
    if (!layoutResult) return;
    
    setIsLayouting(true);
    
    try {
      const result = layoutEngine.handleZoom(events, newViewStart, newViewEnd, layoutResult.clusters);
      setLayoutResult(result);
    } catch (error) {
      console.error('Zoom layout failed:', error);
      setLayoutError(error instanceof Error ? error.message : 'Zoom layout error');
    } finally {
      setIsLayouting(false);
    }
  }, [events, layoutEngine, layoutResult]);

  // Get layout statistics
  const layoutStats = useMemo(() => {
    if (!layoutResult) return null;
    return layoutEngine.getLayoutStats(layoutResult);
  }, [layoutResult, layoutEngine]);

  // Force re-layout
  const forceLayout = useCallback(() => {
    performLayout();
  }, [performLayout]);

  // Update viewport size
  const updateViewport = useCallback((newWidth: number, newHeight: number) => {
    layoutEngine.updateViewport(newWidth, newHeight);
    performLayout();
  }, [layoutEngine, performLayout]);

  return {
    // Layout results
    positionedCards: layoutResult?.positionedCards || [],
    clusters: layoutResult?.clusters || [],
    anchors: layoutResult?.anchors || [],
    utilization: layoutResult?.utilization || { totalSlots: 0, usedSlots: 0, percentage: 0 },
    
    // Layout state
    isLayouting,
    layoutError,
    layoutStats,
    
    // Actions
    handleZoom,
    forceLayout,
    updateViewport,
    
    // Configuration
    config: layoutEngine.getConfig(),
    
    // Raw layout result for advanced usage
    layoutResult
  };
}

// Simple hook for basic usage
export function useSimpleSlotLayout(
  events: Event[],
  viewportWidth: number,
  viewportHeight: number
) {
  const viewStart = useMemo(() => {
    if (events.length === 0) return new Date();
    const dates = events.map(e => new Date(e.date));
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }, [events]);

  const viewEnd = useMemo(() => {
    if (events.length === 0) return new Date();
    const dates = events.map(e => new Date(e.date));
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }, [events]);

  return useSlotBasedLayout({
    events,
    viewStart,
    viewEnd,
    viewportWidth,
    viewportHeight
  });
}