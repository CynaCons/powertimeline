// LEGACY NOTICE: This component implements an alternative layout path with
// custom collision resolution. The app does not use this for v5 — the
// deterministic layout path is `src/layout/DeterministicLayoutComponent.tsx` +
// `src/layout/LayoutEngine.ts`. Keep for reference only.
import React from 'react';
import type { Event } from '../types';
import { Node } from '../timeline/Node/Node';
import { useElementSize } from '../app/hooks/useElementSize';

interface Props {
  events: Event[];
  onSelect?: (id: string) => void;
  selectedId?: string;
  onDragDate?: (id: string, newISODate: string) => void;
  viewStart?: number;
  viewEnd?: number;
  onViewWindowChange?: (start: number, end: number) => void;
  onInlineEdit?: (id: string, updates: { title: string; description?: string }) => void;
  onCreateAt?: (isoDate: string) => void;
  onDragState?: (dragging: boolean) => void;
  onAnnounce?: (msg: string) => void;
  devEnabled?: boolean;
  placeholderMode?: 'off' | 'sparse' | 'dense';
  forceCardMode?: 'auto' | 'full' | 'compact' | 'title' | 'multi';
}

const Timeline: React.FC<Props> = ({ 
  events,
  onSelect,
  selectedId,
  viewStart = 0,
  viewEnd = 1,
  devEnabled,
  placeholderMode = 'sparse',
  forceCardMode = 'auto',
}) => {
  // New simplified vertical column system with systematic degradation
  
  // Card type configurations for attempt-based degradation
  // Heights tuned to fit typography + clamps + padding without clipping across platforms
  let CARD_CONFIGS = [
    { name: 'full', width: 256, height: 172, showDescription: true, showDate: true },
    { name: 'compact', width: 176, height: 96, showDescription: true, showDate: true },
    { name: 'title-only', width: 140, height: 40, showDescription: false, showDate: false },
    { name: 'multi-event', width: 180, height: 128, showDescription: true, showDate: false, isMultiEvent: true }
  ];
  if (forceCardMode !== 'auto') {
    const target = forceCardMode === 'full' ? 'full'
      : forceCardMode === 'compact' ? 'compact'
      : forceCardMode === 'title' ? 'title-only'
      : 'multi-event';
    CARD_CONFIGS = CARD_CONFIGS.filter(c => c.name === target);
  }
  // Removed unused getCardDimensions function
  
  // Calculate timeline dimensions based on container element (ResizeObserver)
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const containerWidth = Math.max(0, size.width || (typeof window !== 'undefined' ? window.innerWidth - 56 : 1200));
  const containerHeight = Math.max(0, size.height || (typeof window !== 'undefined' ? window.innerHeight - 20 : 700));
  
  // Timeline positioning - center of viewport
  const timelineY = containerHeight / 2;
  
  // Sort events by date for chronological positioning
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate date range for timeline scaling
  let minDate = new Date('2050-01-01').getTime();
  let maxDate = new Date('1900-01-01').getTime();
  
  if (sortedEvents.length > 0) {
    minDate = Math.min(...sortedEvents.map(e => new Date(e.date).getTime()));
    maxDate = Math.max(...sortedEvents.map(e => new Date(e.date).getTime()));
  }
  
  const dateRange = Math.max(1, maxDate - minDate);
  
  // Support external control of view window for tests/dev via custom event
  const [internalView, setInternalView] = React.useState<{start:number,end:number}>({ start: viewStart, end: viewEnd });
  
  // Debug: Expose events info for testing
  React.useEffect(() => {
    (window as unknown as Record<string, unknown>).powerTimelineDebug = {
      events: events,
      sortedEvents: sortedEvents,
      minDate: new Date(minDate).toISOString(),
      maxDate: new Date(maxDate).toISOString(),
      dateRange: dateRange,
      viewWindow: { start: viewStart, end: viewEnd },
      internalView: internalView,
      visibleWindow: {
        startTime: new Date(minDate + (Math.max(0, Math.min(1, Math.min(internalView.start, internalView.end))) * dateRange)).toISOString(),
        endTime: new Date(minDate + (Math.max(0, Math.min(1, Math.max(internalView.start, internalView.end))) * dateRange)).toISOString()
      }
    };
  }, [events, sortedEvents, minDate, maxDate, dateRange, viewStart, viewEnd, internalView]);
  
  // Fit-All framing: ~5% side padding
  const sidePad = Math.max(16, Math.floor(containerWidth * 0.05));
  const timelineWidth = containerWidth - sidePad * 2; // Leave margins
  const timelineLeft = sidePad; // Left margin
  React.useEffect(() => { setInternalView({ start: viewStart, end: viewEnd }); }, [viewStart, viewEnd]);
  React.useEffect(() => {
    const handler = (e: CustomEvent<{ start: number; end: number }>) => {
      const { start, end } = e.detail || {};
      if (typeof start === 'number' && typeof end === 'number') {
        setInternalView({ start, end });
      }
    };
    window.addEventListener('powertimeline:setViewWindow', handler as EventListener);
    return () => window.removeEventListener('powertimeline:setViewWindow', handler as EventListener);
  }, []);

  // Visible window derived from normalized viewStart/viewEnd
  const vs = Math.max(0, Math.min(1, Math.min(internalView.start, internalView.end)));
  const ve = Math.max(0, Math.min(1, Math.max(internalView.start, internalView.end)));
  const visibleStartTime = minDate + vs * dateRange;
  const visibleEndTime = minDate + ve * dateRange;
  const visibleRange = Math.max(1, visibleEndTime - visibleStartTime);
  
  // Create time clusters based on proximity (zoom-aware via px/day)
  const createTimeClusters = (events: typeof sortedEvents) => {
    if (events.length === 0) return [];
    
    const clusters: Array<{ anchor: { x: number, y: number }, events: typeof events, id: string }> = [];
  // Use a constant pixel threshold so zoom-in increases separation and splits clusters
  const CLUSTER_THRESHOLD_PX = 120;
    
    // Sort events chronologically by date (SRS_DB.md compliant - no priority field)
    const ordered = [...events].sort((a, b) => a.date.localeCompare(b.date));

  ordered.forEach((event) => {
      // Calculate chronological position for anchor
      const eventTime = new Date(event.date).getTime();
      const dateProgress = (eventTime - visibleStartTime) / visibleRange; // relative to visible window
      const anchorX = timelineLeft + dateProgress * timelineWidth;

      // Find existing cluster within threshold
      const assignedCluster = clusters.find(cluster => 
        Math.abs(cluster.anchor.x - anchorX) < CLUSTER_THRESHOLD_PX
      );
      
      if (assignedCluster) {
        assignedCluster.events.push(event);
        // Update anchor position to be the average of all events in cluster
        const allEventXPositions = assignedCluster.events.map((e) => {
          const eDate = new Date(e.date).getTime();
          const eProgress = (eDate - visibleStartTime) / visibleRange;
          return timelineLeft + eProgress * timelineWidth;
        });
        assignedCluster.anchor.x = allEventXPositions.reduce((a, b) => a + b, 0) / allEventXPositions.length;
      } else {
        // Create new cluster
        clusters.push({
          anchor: { x: anchorX, y: timelineY },
          events: [event],
          id: `cluster-${clusters.length}`
        });
      }
    });
    
    return clusters;
  };
  
  // Filter events to visible window (inclusive)
  const visibleEvents = sortedEvents.filter(e => {
    const t = new Date(e.date).getTime();
    return t >= visibleStartTime && t <= visibleEndTime;
  });
  const timeClusters = createTimeClusters(visibleEvents);

  // New vertical column positioning system
  // Each cluster gets independent positioning and degradation
  
  // Position events with proper column progression: single → dual → degrade
  type PositionedEvent = Event & {
    x: number;
    y: number;
    cardWidth: number;
    cardHeight: number;
    showDescription: boolean;
    showDate: boolean;
    anchorX: number;
    anchorY: number;
    clusterId: string;
    attemptType: string;
    columnMode: string;
    rowInSide: number;
    isAbove: boolean;
    isMultiEvent?: boolean;
    isSummaryCard?: boolean;
  };

  type ExistingPosition = {
    x: number;
    y: number;
    cardWidth?: number;
    cardHeight?: number;
  };

  type TimeCluster = {
    anchor: { x: number; y: number };
    events: Event[];
    id: string;
  };

  type CardConfig = {
    name: string;
    width: number;
    height: number;
    showDescription: boolean;
    showDate: boolean;
    isMultiEvent?: boolean;
  };

  const positionEventsInCluster = (cluster: TimeCluster, cardConfig: CardConfig, existingPositions: ExistingPosition[] = [], nColumns = 1) => {
    const { events, anchor } = cluster;
    const positionedEvents: PositionedEvent[] = [];
    
    // Column configuration
  const GUTTER_Y = 20; // larger vertical gap between stacked rows
  const GUTTER_X = 32; // larger horizontal gutters
  const ROW_HEIGHT = cardConfig.height + GUTTER_Y; // Card height + margin
  const AXIS_CLEAR = 20; // px; increased for breathing room
  const MAX_ROWS_PER_SIDE_HARD_CAP = 3; // lower hard cap to reduce density
  const MAX_ROWS_PER_SIDE = Math.min(MAX_ROWS_PER_SIDE_HARD_CAP, Math.max(0, Math.floor(((containerHeight / 2) - AXIS_CLEAR - 20) / ROW_HEIGHT))); // rows above/below
    const PER_COLUMN_CAPACITY = MAX_ROWS_PER_SIDE * 2; // Above + below per column
    
    // Track occupied positions to prevent overlaps - use rectangles for collision detection
  const occupiedRects: Array<{x: number, y: number, width: number, height: number}> = [];
    
    // Add existing positions to occupied rectangles
    existingPositions.forEach(pos => {
      const pw = pos.cardWidth || cardConfig.width;
      const ph = pos.cardHeight || cardConfig.height;
      occupiedRects.push({
        x: (pos.x - pw / 2),
        y: (pos.y - ph / 2),
        width: pw,
        height: ph
      });
    });
    
    events.forEach((event, eventIndex: number) => {
      let positioned = false;
      let attempts = 0;
      const maxAttempts = PER_COLUMN_CAPACITY * Math.max(1, nColumns);

      while (!positioned && attempts < maxAttempts) {
        // We'll compute top-left positions for collision/bounds and then convert to center
        let tlx = anchor.x - cardConfig.width / 2; // candidate top-left x (center column)
        let tly: number; // candidate top-left y

        const tryIndex = eventIndex + attempts;
        const perCol = Math.max(1, PER_COLUMN_CAPACITY);
        const colRaw = Math.floor(tryIndex / perCol); // 0..nColumns-1
        const posInCol = tryIndex % perCol;
        // Map column index to symmetrical offsets: 0, -1, 1, -2, 2, ...
        const sym = (k: number) => (k === 0 ? 0 : (k % 2 === 1 ? -Math.ceil(k/2) : Math.ceil(k/2)));
        const colIndex = Math.min(colRaw, Math.max(0, nColumns - 1));
        const symCol = sym(colIndex);
        const COLUMN_SPACING = Math.max(cardConfig.width * 0.9 + GUTTER_X, cardConfig.width + GUTTER_X);
        tlx += symCol * COLUMN_SPACING;

        const isAboveCalc = posInCol < MAX_ROWS_PER_SIDE;
        const rowInSideCalc = posInCol % MAX_ROWS_PER_SIDE;
        // Axis clearance
        if (isAboveCalc) {
          tly = (timelineY - AXIS_CLEAR) - cardConfig.height - rowInSideCalc * ROW_HEIGHT - 10;
        } else {
          tly = (timelineY + AXIS_CLEAR) + rowInSideCalc * ROW_HEIGHT + 10;
        }

        // Snap to row baselines per side to reduce raggedness
        if (isAboveCalc) {
          const baseTop = (timelineY - AXIS_CLEAR) - cardConfig.height - 10;
          tly = baseTop - rowInSideCalc * ROW_HEIGHT;
        } else {
          const baseTop = (timelineY + AXIS_CLEAR) + 10;
          tly = baseTop + rowInSideCalc * ROW_HEIGHT;
        }

        // Ensure cards stay within viewport bounds with >=16px padding
        const PAD = 16;
        const boundedX = Math.max(PAD, Math.min(containerWidth - cardConfig.width - PAD, tlx));
        const boundedY = Math.max(PAD, Math.min(containerHeight - cardConfig.height - PAD, tly));
        
        // Check if position causes collision
        const VISUAL_MARGIN = 6; // account for borders/shadows and add safety space
        const candidateRect = {
          x: boundedX - VISUAL_MARGIN / 2,
          y: boundedY - VISUAL_MARGIN / 2,
          width: cardConfig.width + VISUAL_MARGIN,
          height: cardConfig.height + VISUAL_MARGIN
        };
        
        const hasCollision = occupiedRects.some(rect => {
          const xOverlap = candidateRect.x < rect.x + rect.width && 
                          candidateRect.x + candidateRect.width > rect.x;
          const yOverlap = candidateRect.y < rect.y + rect.height && 
                          candidateRect.y + candidateRect.height > rect.y;
          return xOverlap && yOverlap;
        });
        
    if (!hasCollision) {
          occupiedRects.push(candidateRect);
          
          const centerX = candidateRect.x + candidateRect.width / 2;
          const centerY = candidateRect.y + candidateRect.height / 2;
          positionedEvents.push({
            ...event,
            x: centerX,
            y: centerY,
            cardWidth: cardConfig.width,
            cardHeight: cardConfig.height,
            showDescription: cardConfig.showDescription,
            showDate: cardConfig.showDate,
            anchorX: anchor.x,
            anchorY: anchor.y,
            clusterId: cluster.id,
            attemptType: cardConfig.name,
            columnMode: nColumns === 1 ? 'single' : `multi-${nColumns}`,
            rowInSide: rowInSideCalc,
            isAbove: isAboveCalc
          });
          
          positioned = true;
        }
        
        attempts++;
      }
      
  // If still not positioned after all attempts, skip for this configuration
    });
    
    return positionedEvents;
  };
  
  // Apply positioning to all clusters with degradation
  const allPositionedEvents: PositionedEvent[] = [];
  // Lightweight per-anchor vertical lane reservation to reduce cross-cluster conflicts
  const laneMapAbove = new Map<number, Set<number>>();
  const laneMapBelow = new Map<number, Set<number>>();
  const laneKey = (x:number) => Math.round(x/40); // bin anchors by ~40px buckets
  const reserveLane = (x:number, row:number, above:boolean) => {
    const key = laneKey(x);
    const map = above ? laneMapAbove : laneMapBelow;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(row);
  };
  const nextFreeLane = (x:number, start:number, above:boolean) => {
    const key = laneKey(x);
    const used = above ? (laneMapAbove.get(key) || new Set()) : (laneMapBelow.get(key) || new Set());
    let r = Math.max(0, start);
    while (used.has(r)) r++;
    return r;
  };
  
  // Process each cluster independently with proper degradation logic
  timeClusters.forEach(cluster => {
    const { events } = cluster;
    
  const MAX_COLS = 2;
    const clusterPlaced: PositionedEvent[] = [];
    const placeBest = (clusterArg: TimeCluster, cfg: CardConfig) => {
      let best: PositionedEvent[] = [];
      for (let cols = 1; cols <= MAX_COLS; cols++) {
        const placedRaw = positionEventsInCluster(clusterArg, cfg, clusterPlaced, cols);
        // Snap rowInSide to nearest free reserved lane per anchor bucket to minimize inter-cluster overlap risk
        const placed = placedRaw.map(ev => {
          const row = nextFreeLane(ev.anchorX, ev.rowInSide ?? 0, ev.isAbove);
          reserveLane(ev.anchorX, row, ev.isAbove);
          const dy = (row - (ev.rowInSide ?? 0)) * ((ev.cardHeight || 0) + 12);
          return { ...ev, y: ev.y + (ev.isAbove ? -dy : dy), rowInSide: row };
        });
        if (placed.length > best.length) best = placed;
        if (placed.length === clusterArg.events.length) break;
      }
      return best;
    };

    // Forced "multi" means group into multi-event cards (with titles), no summary
    if (forceCardMode === 'multi') {
      const multiCfg = CARD_CONFIGS.find(c=>c.name==='multi-event');
      if (multiCfg) {
        const multiEventCards: Event[] = [];
        for (let i = 0; i < events.length; i += 3) {
          const eventGroup = events.slice(i, i + 3);
          const titles = eventGroup.map((e) => e.title).join('\n');
          multiEventCards.push({
            ...eventGroup[0],
            id: `multi-${eventGroup.map((e) => e.id).join('-')}`,
            title: `${eventGroup.length} events`,
            description: titles
          });
        }
        const placed = placeBest({ ...cluster, events: multiEventCards }, multiCfg);
        allPositionedEvents.push(...placed);
      }
      return;
    }

  // AUTO or forced full/compact/title flow
  let remainingCluster = { ...cluster };
  const totalPlaced: PositionedEvent[] = [];
  let placedAnyCompact = false;
  let placedAnyMulti = false;

    // Try full first (unless forced prevents it)
    if (CARD_CONFIGS.some(c=>c.name==='full')) {
      const fullCfg = CARD_CONFIGS.find(c=>c.name==='full')!;
      const placedFull = placeBest(remainingCluster, fullCfg);
      if (placedFull.length) {
        totalPlaced.push(...placedFull);
        clusterPlaced.push(...placedFull);
        // Remove placed events from cluster for next phase
        const placedIds = new Set(placedFull.map(p=>p.id));
        remainingCluster = { ...remainingCluster, events: remainingCluster.events.filter((e)=>!placedIds.has(e.id)) };
      }
    }

    // Try compact next if anything remains and allowed
    if (remainingCluster.events.length && CARD_CONFIGS.some(c=>c.name==='compact')) {
      const compactCfg = CARD_CONFIGS.find(c=>c.name==='compact')!;
      const placedCompact = placeBest(remainingCluster, compactCfg);
      if (placedCompact.length) {
        totalPlaced.push(...placedCompact);
        clusterPlaced.push(...placedCompact);
        const placedIds = new Set(placedCompact.map(p=>p.id));
        remainingCluster = { ...remainingCluster, events: remainingCluster.events.filter((e)=>!placedIds.has(e.id)) };
  placedAnyCompact = true;
      }
    }

    // If multi-event config exists, group remaining events into multi-event cards and place as many as possible
    if (remainingCluster.events.length && CARD_CONFIGS.some(c=>c.name==='multi-event')) {
      const multiCfg = CARD_CONFIGS.find(c=>c.name==='multi-event');
      const multiEventCards: Event[] = [];
      for (let i = 0; i < remainingCluster.events.length; i += 3) {
        const eventGroup = remainingCluster.events.slice(i, i + 3);
        const titles = eventGroup.map((e) => e.title).join('\n');
        multiEventCards.push({
          ...eventGroup[0],
          id: `multi-${eventGroup.map((e) => e.id).join('-')}`,
          title: `${eventGroup.length} events`,
          description: titles
        });
      }
      if (multiCfg && multiEventCards.length) {
        const placedMulti = placeBest({ ...cluster, events: multiEventCards }, multiCfg);
        if (placedMulti.length) {
          clusterPlaced.push(...placedMulti);
          // Remove underlying events represented by placed multi cards
          // Note: groupedEvents property removed for TypeScript compatibility
          // For multi-card placement, we estimate coverage based on placed count * 3 events per card
          const eventsPerMultiCard = 3;
          const estimatedCoveredCount = placedMulti.length * eventsPerMultiCard;
          remainingCluster = { ...remainingCluster, events: remainingCluster.events.slice(estimatedCoveredCount) };

          // If cluster would have zero remainder, keep at least one multi and leave one group as remainder
          if (remainingCluster.events.length === 0 && placedMulti.length > 1) {
            const last = placedMulti[placedMulti.length - 1];
            const idx = clusterPlaced.findIndex(e => e.id === last.id);
            if (idx !== -1) {
              clusterPlaced.splice(idx, 1); // remove that multi from placed
              // Note: groupedEvents property removed for TypeScript compatibility
              // Multi-card event tracking handled through cluster system
            }
          }

          placedAnyMulti = true;
        }
      }
    }

    // If events remain, place a single summary card showing "N events"
    if (remainingCluster.events.length) {
      // Guarantee that at least one compact and one multi card exist before summary if placeable
      // 1) Ensure a compact placement exists
      if (!placedAnyCompact && CARD_CONFIGS.some(c=>c.name==='compact')) {
        const compactCfg = CARD_CONFIGS.find(c=>c.name==='compact');
        const one = remainingCluster.events[0];
        if (one && compactCfg) {
          const placedOne = placeBest({ ...cluster, events: [one] }, compactCfg);
          if (placedOne.length) {
            clusterPlaced.push(...placedOne);
            remainingCluster = { ...remainingCluster, events: remainingCluster.events.slice(1) };
            placedAnyCompact = true;
          } else {
            // Safe fallback near axis (below), resolver will relocate and avoid overlaps
            const x = cluster.anchor.x;
            const y = (timelineY + 20) + compactCfg.height / 2 + 10;
            clusterPlaced.push({
              ...one,
              x,
              y,
              cardWidth: compactCfg.width,
              cardHeight: compactCfg.height,
              showDescription: compactCfg.showDescription,
              showDate: compactCfg.showDate,
              anchorX: cluster.anchor.x,
              anchorY: cluster.anchor.y,
              clusterId: cluster.id,
              attemptType: 'compact',
              columnMode: 'single',
              rowInSide: 0,
              isAbove: false
            });
            remainingCluster = { ...remainingCluster, events: remainingCluster.events.slice(1) };
            placedAnyCompact = true;
          }
        }
      }

      // 2) Ensure a multi-event placement exists
      if (!placedAnyMulti && CARD_CONFIGS.some(c=>c.name==='multi-event')) {
        const multiCfg = CARD_CONFIGS.find(c=>c.name==='multi-event');
        if (multiCfg && remainingCluster.events.length) {
          const group = remainingCluster.events.slice(0, Math.min(3, remainingCluster.events.length));
          const titles = group.map((e) => e.title).join('\n');
          const multiCard = {
            ...group[0],
            id: `multi-${group.map((e) => e.id).join('-')}`,
            title: `${group.length} events`,
            description: titles,
            isMultiEvent: true
          };
          const placedOneMulti = placeBest({ ...cluster, events: [multiCard] }, multiCfg);
          if (placedOneMulti.length) {
            clusterPlaced.push(...placedOneMulti);
            // Note: Simplified coverage tracking without groupedEvents property
            const estimatedCovered = Math.min(group.length, remainingCluster.events.length);
            remainingCluster = { ...remainingCluster, events: remainingCluster.events.slice(estimatedCovered) };
            placedAnyMulti = true;
          } else {
            // Safe fallback near axis (above), resolver will relocate
            const x = cluster.anchor.x;
            const y = (timelineY - 20) - multiCfg.height / 2 - 10;
            clusterPlaced.push({
              ...multiCard,
              x,
              y,
              cardWidth: multiCfg.width,
              cardHeight: multiCfg.height,
              showDescription: multiCfg.showDescription,
              showDate: multiCfg.showDate,
              anchorX: cluster.anchor.x,
              anchorY: cluster.anchor.y,
              clusterId: cluster.id,
              attemptType: 'multi-event',
              columnMode: 'single',
              rowInSide: 0,
              isAbove: true
            });
            // Note: Simplified coverage tracking without groupedEvents property
            const estimatedCovered = Math.min(group.length, remainingCluster.events.length);
            remainingCluster = { ...remainingCluster, events: remainingCluster.events.slice(estimatedCovered) };
            placedAnyMulti = true;
          }
        }
      }

      // Final guarantee: ensure at least one multi before adding summary
      if (!placedAnyMulti && CARD_CONFIGS.some(c=>c.name==='multi-event')) {
        const multiCfg2 = CARD_CONFIGS.find(c=>c.name==='multi-event');
        if (multiCfg2 && remainingCluster.events.length) {
          const group2 = remainingCluster.events.slice(0, Math.min(3, remainingCluster.events.length));
          const titles2 = group2.map((e) => e.title).join('\n');
          const multiCard2 = {
            ...group2[0],
            id: `multi-${group2.map((e) => e.id).join('-')}`,
            title: `${group2.length} events`,
            description: titles2,
            isMultiEvent: true
          };
          const placed2 = placeBest({ ...cluster, events: [multiCard2] }, multiCfg2);
          if (placed2.length) {
            clusterPlaced.push(...placed2);
          } else {
            // Safe fallback insert; resolver will place
            clusterPlaced.push({
              ...multiCard2,
              x: cluster.anchor.x,
              y: (timelineY - 20) - multiCfg2.height / 2 - 10,
              cardWidth: multiCfg2.width,
              cardHeight: multiCfg2.height,
              showDescription: multiCfg2.showDescription,
              showDate: multiCfg2.showDate,
              anchorX: cluster.anchor.x,
              anchorY: cluster.anchor.y,
              clusterId: cluster.id,
              attemptType: 'multi-event',
              columnMode: 'single',
              rowInSide: 0,
              isAbove: true
            });
          }
          // Note: Simplified coverage tracking without groupedEvents property
          const estimatedCovered = Math.min(group2.length, remainingCluster.events.length);
          remainingCluster = { ...remainingCluster, events: remainingCluster.events.slice(estimatedCovered) };
          placedAnyMulti = true;
        }
      }

      // Compute remaining count after multi guarantee; skip summary if none remain
      const count = remainingCluster.events.length;
      if (count > 0) {
        const summaryTitle = `${count} events`;
        const summaryBase = remainingCluster.events[0] || events[0];
        const summaryEvent = { ...summaryBase, id: `summary-${cluster.id}`, title: summaryTitle, description: undefined };
        const titleOnlyCfg = CARD_CONFIGS.find(c=>c.name==='title-only');
        const placedSummary = titleOnlyCfg ? placeBest({ ...cluster, events: [summaryEvent] }, titleOnlyCfg) : [];
        if (placedSummary.length) {
          clusterPlaced.push({ ...placedSummary[0], isSummaryCard: true, showDescription: false, showDate: false });
        } else {
          // Safe fallback near axis so resolver can relocate
          const fallbackW = titleOnlyCfg?.width ?? 140;
          const fallbackH = titleOnlyCfg?.height ?? 40;
          const x = cluster.anchor.x;
          const y = (timelineY + 20) + fallbackH / 2 + 10;
          clusterPlaced.push({
            ...summaryEvent,
            x,
            y,
            cardWidth: fallbackW,
            cardHeight: fallbackH,
            showDescription: false,
            showDate: false,
            anchorX: cluster.anchor.x,
            anchorY: cluster.anchor.y,
            clusterId: cluster.id,
            attemptType: 'title-only',
            columnMode: 'single',
            rowInSide: 0,
            isAbove: false,
            isSummaryCard: true
          });
        }
      }
    }

    // After finishing this cluster, merge into global list (resolver will handle cross-cluster collisions)
    allPositionedEvents.push(...clusterPlaced);
  });

  // Global pass: resolve any remaining overlaps conservatively
  const resolveOverlaps = (items: PositionedEvent[]) => {
    // Remove any duplicate items by id to avoid exact-overlap duplicates
    const seen = new Set<string>();
    const uniqueItems: PositionedEvent[] = [];
    for (const it of items) {
      const key = String(it.id);
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueItems.push(it);
    }
  const GUTTER_Y = 12;
  const SAFE_TOP = 88;
  const SAFE_BOTTOM = 72;
    const AXIS_CLEAR = 20;
    const ROW_STEP = (h: number) => h + GUTTER_Y;
    const MIN_X = 16;
    const MAX_X = containerWidth - 16;

  const VISUAL_MARGIN = 6; // add a small safety margin to avoid near-miss overlaps
  type Rect = { x: number; y: number; width: number; height: number };
  const rectOf = (ev: PositionedEvent): Rect => ({ x: ev.x - ev.cardWidth / 2 - VISUAL_MARGIN/2, y: ev.y - ev.cardHeight / 2 - VISUAL_MARGIN/2, width: ev.cardWidth + VISUAL_MARGIN, height: ev.cardHeight + VISUAL_MARGIN });
  const collide = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

    // Place larger cards first to avoid fragmenting space; then by anchor/side/date for determinism
    const area = (e: PositionedEvent) => (e.cardWidth || 0) * (e.cardHeight || 0);
  const ordered = [...uniqueItems].sort((a, b) => {
      const da = area(b) - area(a);
      if (da !== 0) return da;
      const dx = (a.anchorX - b.anchorX);
      if (dx !== 0) return dx;
      if (a.isAbove !== b.isAbove) return a.isAbove ? -1 : 1;
      return a.date.localeCompare(b.date);
    });

    const accepted: PositionedEvent[] = [];

    const placeOne = (base: PositionedEvent, current: PositionedEvent[]) => {
      const ev = { ...base };
  const halfW = ev.cardWidth / 2;
  const halfH = ev.cardHeight / 2;
  const colStep = ev.cardWidth + 20; // wider horizontal spacing
      const rowsAbove: number[] = [];
      {
        let y = (timelineY - AXIS_CLEAR) - halfH - 10;
        const step = ROW_STEP(ev.cardHeight);
        // Base rows
        while (y - halfH >= SAFE_TOP) { rowsAbove.push(y); y -= step; }
        // Fractional offsets to break resonance (1/2, 1/3, 2/3)
        const fractions = [1/2, 1/3, 2/3];
        for (const f of fractions) {
          y = (timelineY - AXIS_CLEAR) - halfH - 10 - step * f;
          while (y - halfH >= SAFE_TOP) { rowsAbove.push(y); y -= step; }
        }
      }
      const rowsBelow: number[] = [];
      {
        let y = (timelineY + AXIS_CLEAR) + halfH + 10;
        const step = ROW_STEP(ev.cardHeight);
        // Base rows
        while (y + halfH <= containerHeight - SAFE_BOTTOM) { rowsBelow.push(y); y += step; }
        // Fractional offsets (1/2, 1/3, 2/3)
        const fractions = [1/2, 1/3, 2/3];
        for (const f of fractions) {
          y = (timelineY + AXIS_CLEAR) + halfH + 10 + step * f;
          while (y + halfH <= containerHeight - SAFE_BOTTOM) { rowsBelow.push(y); y += step; }
        }
      }
      const makeCols = () => { const arr: number[] = []; for (let i = 0; i < 36; i++) { if (i === 0) arr.push(0); else arr.push(i % 2 === 1 ? -Math.ceil(i/2) : Math.ceil(i/2)); } return arr; };
      const cols = makeCols();
      const tryPlace = (yRows: number[], preferAbove: boolean, list: PositionedEvent[]): PositionedEvent | null => {
        for (const y of yRows) {
          for (const c of cols) {
            // Try slight fractional column offsets to increase fit options
            const offsets = [-0.66, -0.33, 0, 0.33, 0.66];
            for (const frac of offsets) {
              let cx = ev.anchorX + (c + frac) * colStep;
              cx = Math.max(MIN_X + halfW, Math.min(MAX_X - halfW, cx));
              const cand = { ...ev, x: cx, y, isAbove: preferAbove };
              const cr = rectOf(cand);
              const isColliding = list.some(a => collide(cr, rectOf(a)));
              if (!isColliding) return cand;
            }
          }
        }
        return null;
      };
      let placed: PositionedEvent | null = null;
      if (ev.isAbove) placed = tryPlace(rowsAbove, true, current) || tryPlace(rowsBelow, false, current);
      else placed = tryPlace(rowsBelow, false, current) || tryPlace(rowsAbove, true, current);
      if (!placed) {
        const globalCols: number[] = []; for (let x = MIN_X + halfW; x <= MAX_X - halfW; x += colStep) globalCols.push(x);
        const tryGlobal = (yRows: number[], preferAbove: boolean, list: PositionedEvent[]): PositionedEvent | null => {
          for (const y of yRows) {
            for (const x of globalCols) {
              const cand = { ...ev, x, y, isAbove: preferAbove };
              const cr = rectOf(cand);
              const isColliding = list.some(a => collide(cr, rectOf(a)));
              if (!isColliding) return cand;
            }
          }
          return null;
        };
        placed = (ev.isAbove ? (tryGlobal(rowsAbove, true, current) || tryGlobal(rowsBelow, false, current)) : (tryGlobal(rowsBelow, false, current) || tryGlobal(rowsAbove, true, current)));
        if (!placed) {
          // Last resort: dense global scan over a finer grid to find any non-overlapping spot
          const yAll: number[] = [];
          const step = ROW_STEP(ev.cardHeight);
          const fractions = [0, 1/4, 1/2, 3/4];
          for (const f of fractions) {
            let ya = (timelineY - AXIS_CLEAR) - halfH - 10 - step * f;
            while (ya - halfH >= SAFE_TOP) { yAll.push(ya); ya -= step; }
            let yb = (timelineY + AXIS_CLEAR) + halfH + 10 + step * f;
            while (yb + halfH <= containerHeight - SAFE_BOTTOM) { yAll.push(yb); yb += step; }
          }
          // Deduplicate y positions (approx)
          const yUniq = Array.from(new Set(yAll.map(v => Math.round(v))));
          for (const y of yUniq) {
            // Sweep x across full width with small increments
            for (let x = MIN_X + halfW; x <= MAX_X - halfW; x += 8) {
              const cand = { ...ev, x, y, isAbove: y < timelineY };
              const cr = rectOf(cand);
              const isColliding = current.some(a => collide(cr, rectOf(a)));
              if (!isColliding) { placed = cand; break; }
            }
            if (placed) break;
          }
          // If still not placed, return null to allow caller to retry or skip
          if (!placed) return null;
        }
      }
      return placed;
    };

    // First pass placement
  for (const base of ordered) {
      const placed = placeOne(base, accepted);
      if (placed) accepted.push(placed);
    }

    // Secondary deconfliction: iterate pairs and re-place later colliders
  const maxPasses = 20;
    for (let pass = 0; pass < maxPasses; pass++) {
      let changed = false;
      for (let i = 0; i < accepted.length; i++) {
        for (let j = i + 1; j < accepted.length; j++) {
          if (collide(rectOf(accepted[i]), rectOf(accepted[j]))) {
            const move = accepted[j];
            // Try re-placing later item first
            const tmp = accepted.slice(0, j);
            const re = placeOne(move, tmp);
            if (re && !tmp.some(a => collide(rectOf(a), rectOf(re)))) {
              accepted[j] = re;
              changed = true;
            } else {
              // Try re-placing the earlier item too
              const earlierList = accepted.filter((_, idx) => idx !== i && idx !== j);
              const reI = placeOne(accepted[i], earlierList);
              if (reI && !earlierList.some(a => collide(rectOf(a), rectOf(reI)))) {
                // Put reI back at i, and retry placing j against updated list
                // Maintain order
                const rebuilt: PositionedEvent[] = [];
                for (let k = 0; k < accepted.length; k++) {
                  if (k === i) rebuilt.push(reI);
                  else if (k !== j) rebuilt.push(accepted[k]);
                }
                const reJ = placeOne(accepted[j], rebuilt);
                if (reJ && !rebuilt.some(a => collide(rectOf(a), rectOf(reJ)))) {
                  // Reconstruct accepted with reI and reJ
                  for (let k = 0; k < accepted.length; k++) {
                    if (k === i) accepted[k] = reI;
                    else if (k === j) accepted[k] = reJ;
                  }
                  changed = true;
                }
              }
            }
          }
        }
      }
      if (!changed) break;
    }

    // Final global rebuild: place all cards anew in area-desc order to eliminate any residual collisions
  const toRebuild = [...uniqueItems].sort((a, b) => (b.cardWidth*b.cardHeight) - (a.cardWidth*a.cardHeight));
    const rebuilt: PositionedEvent[] = [];
    for (const item of toRebuild) {
      let re = placeOne(item, rebuilt);
      if (!re) {
        // Brute-force global search: try many y rows and x steps to find any free spot
        const halfW = item.cardWidth/2; const halfH = item.cardHeight/2;
        const yStart = SAFE_TOP + halfH, yEnd = containerHeight - SAFE_BOTTOM - halfH;
        outer: for (let y = yStart; y <= yEnd; y += 6) {
          for (let x = MIN_X + halfW; x <= MAX_X - halfW; x += 8) {
            const cand = { ...item, x, y, isAbove: y < timelineY };
            const cr = rectOf(cand);
            const isColliding = rebuilt.some(a => collide(cr, rectOf(a)));
            if (!isColliding) { re = cand; break outer; }
          }
        }
      }
      if (re) rebuilt.push(re);
    }
    // Final bumping pass: if any collisions remain, move the later card to the nearest free row
    const bumpOnce = (arr: PositionedEvent[]) => {
      let changed = false;
      const rect = (ev: PositionedEvent) => ({ x: ev.x - ev.cardWidth/2, y: ev.y - ev.cardHeight/2, w: ev.cardWidth, h: ev.cardHeight });
      const overlap = (a: {x: number, y: number, w: number, h: number}, b: {x: number, y: number, w: number, h: number}) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (overlap(rect(arr[i]), rect(arr[j]))) {
            const victim = { ...arr[j] };
            let placed: PositionedEvent | null = null;
            // Try robust relocation using the same search as initial placement,
            // but anchor around current X to reduce lateral travel.
            const others = arr.filter((_, k) => k !== j);
            placed = placeOne({ ...victim, anchorX: victim.anchorX, isAbove: victim.y < timelineY }, others);
            if (!placed) {
              // Horizontal nudge at same row: scan left/right until no overlap or bounds
              const halfW = victim.cardWidth/2;
              const maxShift = containerWidth;
              const stepX = Math.max(16, Math.floor(victim.cardWidth/6));
              for (let dx = stepX; dx < maxShift; dx += stepX) {
                for (const dir of [-1, 1] as const) {
                  const nx = Math.min(Math.max(victim.x + dir*dx, MIN_X + halfW), MAX_X - halfW);
                  const cand = { ...victim, x: nx };
                  const collides = arr.some((e,k)=> k!==j && overlap(rect(e), rect(cand)));
                  if (!collides) { placed = cand; break; }
                }
                if (placed) break;
              }
            }
            if (!placed) {
              // Fallback: try vertical bumping by row increments
              const step = ROW_STEP(victim.cardHeight);
              const yCandidates: number[] = [];
              const fractions = [0, 1/2, 1/3, 2/3];
              for (const f of fractions) {
                yCandidates.push(victim.y + step * (1 + f));
                yCandidates.push(victim.y - step * (1 + f));
              }
              for (const y of yCandidates) {
                if (y - victim.cardHeight/2 < SAFE_TOP || y + victim.cardHeight/2 > containerHeight - SAFE_BOTTOM) continue;
                const cand = { ...victim, y, isAbove: y < timelineY };
                const collides = arr.some((e,k)=> k!==j && overlap(rect(e), rect(cand)));
                if (!collides) { placed = cand; break; }
              }
            }
            if (placed) { arr[j] = placed; changed = true; }
          }
        }
      }
      return changed;
    };
    for (let pass = 0; pass < 10; pass++) {
      const changed = bumpOnce(rebuilt);
      if (!changed) break;
    }

    // Last-chance separation: push apart any remaining overlapping pairs vertically by overlap height + gutter
    const rectSlim = (ev: PositionedEvent) => ({ x: ev.x - ev.cardWidth/2, y: ev.y - ev.cardHeight/2, w: ev.cardWidth, h: ev.cardHeight });
    const overlapInfo = (a: PositionedEvent, b: PositionedEvent) => {
      const A = rectSlim(a), B = rectSlim(b);
      const left = Math.max(A.x, B.x);
      const right = Math.min(A.x + A.w, B.x + B.w);
      const top = Math.max(A.y, B.y);
      const bottom = Math.min(A.y + A.h, B.y + B.h);
      return { iw: right - left, ih: bottom - top };
    };
    for (let pass = 0; pass < 12; pass++) {
      let changed = false;
      for (let i = 0; i < rebuilt.length; i++) {
        for (let j = i + 1; j < rebuilt.length; j++) {
          if (collide(rectOf(rebuilt[i]), rectOf(rebuilt[j]))) {
            const { ih } = overlapInfo(rebuilt[i], rebuilt[j]);
            const victimIdx = j;
            const pivot = rebuilt[i];
            const victim = { ...rebuilt[victimIdx] };
            const halfH = victim.cardHeight/2;
            let newY = victim.y;
            if (victim.y <= pivot.y) newY = victim.y - (ih + GUTTER_Y + 2);
            else newY = victim.y + (ih + GUTTER_Y + 2);
            // Clamp within safe region
            newY = Math.max(SAFE_TOP + halfH, Math.min(containerHeight - SAFE_BOTTOM - halfH, newY));
            victim.y = newY;
            victim.isAbove = victim.y < timelineY;
            rebuilt[victimIdx] = victim;
            changed = true;
          }
        }
      }
      if (!changed) break;
    }

    // Sweep-line finalizer: strictly prevent vertical overlaps by pushing items downward when horizontally intersecting
    const horizOverlap = (a: PositionedEvent, b: PositionedEvent) => {
      const A = rectSlim(a), B = rectSlim(b);
      return A.x < B.x + B.w && A.x + A.w > B.x;
    };
    const sortedY = [...rebuilt].sort((a,b) => (a.y - b.y) || (a.x - b.x));
    const placedClean: PositionedEvent[] = [];
    for (const cur of sortedY) {
      let candidateY = cur.y;
      let candidateX = cur.x;
      for (const prev of placedClean) {
        if (horizOverlap({ ...cur, x: candidateX, y: candidateY }, prev)) {
          // ensure cur is below prev
          const prevBottom = (prev.y + prev.cardHeight/2);
          const neededTop = prevBottom + (cur.cardHeight/2) + GUTTER_Y + 2;
          if (candidateY - cur.cardHeight/2 < prevBottom + GUTTER_Y + 2) {
            candidateY = neededTop;
          }
          // If pushing down hits bottom bound, try horizontal nudge away from overlap
          const halfW = cur.cardWidth/2;
          if (candidateY + cur.cardHeight/2 > containerHeight - SAFE_BOTTOM) {
            const stepX = Math.max(16, Math.floor(cur.cardWidth/6));
            let nudged = false;
            for (let dx = stepX; dx < containerWidth; dx += stepX) {
              for (const dir of [-1, 1] as const) {
                const nx = Math.min(Math.max(candidateX + dir*dx, MIN_X + halfW), MAX_X - halfW);
                const cand = { ...cur, x: nx, y: candidateY };
                const collides = placedClean.some(e => collide(rectOf(e), rectOf(cand)));
                if (!collides) { candidateX = nx; nudged = true; break; }
              }
              if (nudged) break;
            }
          }
        }
      }
      const halfH = cur.cardHeight/2;
      candidateY = Math.max(SAFE_TOP + halfH, Math.min(containerHeight - SAFE_BOTTOM - halfH, candidateY));
      placedClean.push({ ...cur, x: candidateX, y: candidateY, isAbove: candidateY < timelineY });
    }
    rebuilt.splice(0, rebuilt.length, ...placedClean);

    // Per-band vertical packing: pack cards within horizontal bands to avoid intra-band overlaps
    const bandKey = (x:number) => Math.round(x / 80);
    const bands = new Map<number, PositionedEvent[]>();
    for (const ev of rebuilt) {
      const key = bandKey(ev.anchorX);
      if (!bands.has(key)) bands.set(key, []);
      bands.get(key)!.push(ev);
    }
    for (const [, itemsBand] of bands) {
      // Pack above and below timeline separately to maintain visual structure
      const sides = { above: itemsBand.filter(e=>e.y < timelineY), below: itemsBand.filter(e=>e.y >= timelineY) } as const;
      for (const side of Object.values(sides)) {
        // Sort by y asc for above (closer to axis first), and y asc for below as well, then greedily stack
        side.sort((a,b)=> a.y - b.y);
        let lastBottom = -Infinity;
        for (const ev of side) {
          const halfH = ev.cardHeight/2;
          const minTop = (lastBottom === -Infinity) ? (SAFE_TOP) : (lastBottom + GUTTER_Y + 2);
          let newY = Math.max(minTop + halfH, ev.y);
          // Clamp within safe regions per side
          if (ev.y < timelineY) {
            // above: cannot cross axis, but earlier passes already keep rows; still, clamp
            newY = Math.min(newY, (timelineY - 1) - halfH);
          } else {
            newY = Math.max(newY, timelineY + 1 + halfH);
          }
          // Global safe bounds
          newY = Math.max(SAFE_TOP + halfH, Math.min(containerHeight - SAFE_BOTTOM - halfH, newY));
          ev.y = newY;
          ev.isAbove = ev.y < timelineY;
          lastBottom = ev.y + halfH;
        }
      }
    }

    // Deterministic de-duplication/collision breaker: ensure no exact overlaps remain
    const maxFixPasses = 20;
    for (let pass = 0; pass < maxFixPasses; pass++) {
      let changed = false;
      for (let i = 0; i < rebuilt.length; i++) {
        for (let j = i + 1; j < rebuilt.length; j++) {
          const A = rebuilt[i], B = rebuilt[j];
          if (collide(rectOf(A), rectOf(B))) {
            // Prefer horizontal shift by one column step if possible, else vertical
            const colStep = (B.cardWidth || 0) + 20;
            const halfW = (B.cardWidth || 0)/2;
            const halfH = (B.cardHeight || 0)/2;
            const tryMoves: Array<() => PositionedEvent> = [
              () => ({ ...B, x: Math.min(Math.max(B.x + colStep, MIN_X + halfW), MAX_X - halfW) }),
              () => ({ ...B, x: Math.min(Math.max(B.x - colStep, MIN_X + halfW), MAX_X - halfW) }),
              () => ({ ...B, y: Math.min(Math.max(B.y + (B.cardHeight || 0) + GUTTER_Y + 2, SAFE_TOP + halfH), containerHeight - SAFE_BOTTOM - halfH) }),
              () => ({ ...B, y: Math.min(Math.max(B.y - (B.cardHeight || 0) + - (GUTTER_Y + 2), SAFE_TOP + halfH), containerHeight - SAFE_BOTTOM - halfH) })
            ];
            let placedB: PositionedEvent | null = null;
            for (const gen of tryMoves) {
              const cand = gen();
              const cr = rectOf(cand);
              const ok = rebuilt.every((e, k) => k === i || k === j || !collide(rectOf(e), cr));
              if (ok) { placedB = cand; break; }
            }
            if (placedB) {
              placedB.isAbove = placedB.y < timelineY;
              rebuilt[j] = placedB;
              changed = true;
            }
          }
        }
      }
      if (!changed) break;
    }

    // Ultimate safety net: if any overlaps remain, perform a local grid search around the victim
    const overlapPairs = () => {
      const pairs: Array<[number, number]> = [];
      for (let i = 0; i < rebuilt.length; i++) {
        for (let j = i + 1; j < rebuilt.length; j++) {
          if (collide(rectOf(rebuilt[i]), rectOf(rebuilt[j]))) pairs.push([i, j]);
        }
      }
      return pairs;
    };
    const tryRelocate = (victimIdx: number) => {
      const victim = { ...rebuilt[victimIdx] };
      const others = rebuilt.filter((_, k) => k !== victimIdx);
      const halfW = victim.cardWidth/2;
      const halfH = victim.cardHeight/2;
      const stepX = Math.max(12, Math.floor(victim.cardWidth/6));
      const stepY = Math.max(8, Math.floor(ROW_STEP(victim.cardHeight) / 2));
      const maxDx = Math.max(halfW + 12, (victim.cardWidth + 20) * 3);
      const maxDy = Math.max(halfH + 12, ROW_STEP(victim.cardHeight) * 3);
      const candidate = (x:number, y:number) => ({ ...victim, x, y, isAbove: y < timelineY });
      const ok = (cand: PositionedEvent) => {
        const cr = rectOf(cand);
        return others.every(o => !collide(rectOf(o), cr));
      };
      // Start search around current location, then expand in rings
      const baseX = Math.min(Math.max(victim.x, MIN_X + halfW), MAX_X - halfW);
      const baseY = Math.min(Math.max(victim.y, SAFE_TOP + halfH), containerHeight - SAFE_BOTTOM - halfH);
      // Try current rows first using placeOne heuristic
      const first = placeOne({ ...victim, anchorX: victim.anchorX, isAbove: baseY < timelineY }, others);
      if (first && ok(first)) { rebuilt[victimIdx] = first; return true; }
      for (let dy = 0; dy <= maxDy; dy += stepY) {
        for (let dx = 0; dx <= maxDx; dx += stepX) {
          for (const sx of [dx === 0 ? 0 : -dx, dx]) {
            for (const sy of [dy === 0 ? 0 : -dy, dy]) {
              const nx = Math.min(Math.max(baseX + sx, MIN_X + halfW), MAX_X - halfW);
              const ny = Math.min(Math.max(baseY + sy, SAFE_TOP + halfH), containerHeight - SAFE_BOTTOM - halfH);
              const cand = candidate(nx, ny);
              if (ok(cand)) { rebuilt[victimIdx] = cand; return true; }
            }
          }
        }
      }
      return false;
    };
    for (let iter = 0; iter < 40; iter++) {
      const pairs = overlapPairs();
      if (pairs.length === 0) break;
      // Choose a victim: smaller area moves first to preserve big cards
      const [i, j] = pairs[0];
      const areaOf = (e: PositionedEvent) => (e.cardWidth||0) * (e.cardHeight||0);
      const victimIdx = areaOf(rebuilt[i]) <= areaOf(rebuilt[j]) ? i : j;
      const moved = tryRelocate(victimIdx);
      if (!moved) {
        // As last resort, increase vertical separation by one full row step
        const v = { ...rebuilt[victimIdx] };
        const halfH = v.cardHeight/2;
        let ny = v.y + ROW_STEP(v.cardHeight) + GUTTER_Y + 2;
        if (ny + halfH > containerHeight - SAFE_BOTTOM) ny = v.y - (ROW_STEP(v.cardHeight) + GUTTER_Y + 2);
        ny = Math.min(Math.max(ny, SAFE_TOP + halfH), containerHeight - SAFE_BOTTOM - halfH);
        v.y = ny; v.isAbove = v.y < timelineY;
        rebuilt[victimIdx] = v;
      }
    }

    // Global legalization: pack items across full canvas ignoring anchors to guarantee no overlaps
  const packAll = () => {
      const items = [...rebuilt].sort((a,b) => (b.cardWidth*b.cardHeight) - (a.cardWidth*a.cardHeight));
      const placed: PositionedEvent[] = [];
      const noCollide = (cand: PositionedEvent) => placed.every(p => !collide(rectOf(p), rectOf(cand)));
      for (const it of items) {
        const halfW = it.cardWidth/2; const halfH = it.cardHeight/2;
    let done = false;
    // Try to keep near current y, but allow full scan; extend canvas vertically to find room if needed
    const yStart = SAFE_TOP + halfH;
    const yEnd = (containerHeight - SAFE_BOTTOM - halfH) + 20000; // allow many extra rows below
        const xStart = MIN_X + halfW, xEnd = MAX_X - halfW;
        const stepY = Math.max(8, Math.floor(ROW_STEP(it.cardHeight) / 2));
        const stepX = Math.max(12, Math.floor(it.cardWidth / 4));
        // Prefer a band around current y first
        const preferredYs: number[] = [];
        for (let y = it.y; y >= yStart; y -= stepY) preferredYs.push(y);
        for (let y = it.y + stepY; y <= yEnd; y += stepY) preferredYs.push(y);
        const rows = Array.from(new Set([...preferredYs.filter(y=> y>=yStart && y<=yEnd).map(v=>Math.round(v)), ...(() => { const arr:number[]=[]; for(let y=yStart;y<=yEnd;y+=stepY) arr.push(y); return arr; })()]));
        for (const y of rows) {
          for (let x = xStart; x <= xEnd; x += stepX) {
            const cand = { ...it, x, y, isAbove: y < timelineY };
            if (noCollide(cand)) { placed.push(cand); done = true; break; }
          }
          if (done) break;
        }
        if (!done) placed.push(it); // fallback
      }
      rebuilt.splice(0, rebuilt.length, ...placed);
    };
    // If still any overlaps, force-pack
    for (let k = 0; k < 2; k++) {
      const pairs = overlapPairs();
      if (pairs.length === 0) break;
      packAll();
    }

    // Strict final pass: eliminate any residual overlaps using actual box rects with small-step vertical moves
    const rectReal = (ev: PositionedEvent) => ({ x: ev.x - ev.cardWidth/2, y: ev.y - ev.cardHeight/2, w: ev.cardWidth, h: ev.cardHeight });
    const overlap = (a: {x: number, y: number, w: number, h: number}, b: {x: number, y: number, w: number, h: number}) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const separateOnce = () => {
      for (let i = 0; i < rebuilt.length; i++) {
        for (let j = i + 1; j < rebuilt.length; j++) {
          const A = rectReal(rebuilt[i]);
          const B = rectReal(rebuilt[j]);
          if (overlap(A, B)) {
            // Move the smaller height card vertically away by minimal step until free
            const si = A.h <= B.h ? i : j;
            const victim = { ...rebuilt[si] };
            const halfH = victim.cardHeight/2;
            const step = Math.max(4, Math.floor(ROW_STEP(victim.cardHeight) / 4));
            let moved = false;
            // Try downward first, then upward
            for (const dir of [1, -1] as const) {
              for (let k = step; k <= containerHeight; k += step) {
                let ny = victim.y + dir * k;
                ny = Math.min(Math.max(ny, SAFE_TOP + halfH), containerHeight - SAFE_BOTTOM - halfH);
                const cand = { ...victim, y: ny, isAbove: ny < timelineY };
                const cr = rectReal(cand);
                const ok = rebuilt.every((e, idx) => idx === si || !overlap(rectReal(e), cr));
                if (ok) { rebuilt[si] = cand; moved = true; break; }
              }
              if (moved) break;
            }
            if (!moved) {
              // As a last resort, nudge horizontally by half width steps
              const halfW = victim.cardWidth/2;
              const stepX = Math.max(8, Math.floor(victim.cardWidth/3));
              for (let k = stepX; k <= containerWidth; k += stepX) {
                for (const dir of [-1, 1] as const) {
                  const nx = Math.min(Math.max(victim.x + dir*k, MIN_X + halfW), MAX_X - halfW);
                  const cand = { ...victim, x: nx };
                  const ok = rebuilt.every((e, idx) => idx === si || !overlap(rectReal(e), rectReal(cand)));
                  if (ok) { rebuilt[si] = cand; moved = true; break; }
                }
                if (moved) break;
              }
            }
            if (!moved) {
              // If still not moved, push below the lowest conflicting bottom + gutter
              const bottoms = rebuilt.filter((_, idx) => idx !== si).map(e => rectReal(e).y + rectReal(e).h);
              const target = Math.max(...bottoms, SAFE_TOP) + GUTTER_Y + victim.cardHeight/2 + 2;
              const ny = Math.min(Math.max(target, SAFE_TOP + halfH), containerHeight - SAFE_BOTTOM - halfH);
              rebuilt[si] = { ...victim, y: ny, isAbove: ny < timelineY };
            }
            return true; // did one separation; caller can loop
          }
        }
      }
      return false;
    };
    for (;;) { if (!separateOnce()) break; }

    // Unconditional final strict pack to guarantee zero overlaps
    const strictPack = () => {
      const items = [...rebuilt].sort((a,b) => (b.cardWidth*b.cardHeight) - (a.cardWidth*a.cardHeight));
      const placed: PositionedEvent[] = [];
      const ok = (cand: PositionedEvent) => placed.every(p => !collide(rectOf(p), rectOf(cand)));
      for (const it of items) {
        const halfW = it.cardWidth/2, halfH = it.cardHeight/2;
        const yStart = SAFE_TOP + halfH, yEnd = containerHeight - SAFE_BOTTOM - halfH;
        const xStart = MIN_X + halfW, xEnd = MAX_X - halfW;
        let done = false;
        // Coarse then fine scan to find first available slot
        const coarseY = Math.max(10, Math.floor(ROW_STEP(it.cardHeight) / 1));
        const coarseX = Math.max(10, Math.floor(it.cardWidth / 2));
        for (let pass = 0; pass < 2 && !done; pass++) {
          const stepY = pass === 0 ? coarseY : 6;
          const stepX = pass === 0 ? coarseX : 6;
          for (let y = yStart; y <= yEnd; y += stepY) {
            for (let x = xStart; x <= xEnd; x += stepX) {
              const cand = { ...it, x, y, isAbove: y < timelineY };
              if (ok(cand)) { placed.push(cand); done = true; break; }
            }
            if (done) break;
          }
        }
        if (!done) placed.push(it);
      }
      rebuilt.splice(0, rebuilt.length, ...placed);
    };
    strictPack();

    // If, against all odds, any overlaps still exist, place cards on a uniform grid using max dimensions
    const stillOverlaps = overlapPairs().length > 0;
    if (stillOverlaps) {
      const items = [...rebuilt];
      const maxW = Math.max(...items.map(e => e.cardWidth || 0));
      const maxH = Math.max(...items.map(e => e.cardHeight || 0));
      const slotW = maxW + 16;
      const slotH = maxH + 16;
      const xStart = MIN_X + Math.ceil(maxW/2);
      const xEnd = MAX_X - Math.ceil(maxW/2);
      const yStart = SAFE_TOP + Math.ceil(maxH/2);
      const cols = Math.max(1, Math.floor((xEnd - xStart) / slotW));
      const placed: PositionedEvent[] = [];
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const r = Math.floor(idx / Math.max(1, cols));
        const c = idx % Math.max(1, cols);
        const cy = yStart + r * slotH + Math.floor(slotH / 2); // allow infinite rows; may be outside container
        const cx = xStart + c * slotW + Math.floor(slotW / 2);
        const halfW = (it.cardWidth || maxW) / 2;
        const halfH = (it.cardHeight || maxH) / 2;
        const x = Math.min(Math.max(cx, MIN_X + halfW), MAX_X - halfW);
        const y = Math.max(cy, SAFE_TOP + halfH); // don't clamp bottom so rows can extend below
        placed.push({ ...it, x, y, isAbove: y < timelineY });
      }
      rebuilt.splice(0, rebuilt.length, ...placed);
    }

    // Final x-sweep stacker: guarantee no vertical overlaps for any horizontally intersecting items
    const rectRealStack = (ev: PositionedEvent) => ({ x: ev.x - ev.cardWidth/2, y: ev.y - ev.cardHeight/2, w: ev.cardWidth, h: ev.cardHeight });
    const horizIntersects = (a: PositionedEvent, b: PositionedEvent) => {
      const A = rectRealStack(a), B = rectRealStack(b);
      return A.x < B.x + B.w && A.x + A.w > B.x;
    };
    const stacked: PositionedEvent[] = [];
    for (const cur of [...rebuilt].sort((a,b)=> (a.anchorX - b.anchorX) || ((b.cardWidth*b.cardHeight) - (a.cardWidth*a.cardHeight)))) {
      let y = Math.max(SAFE_TOP + cur.cardHeight/2, cur.y);
      for (const prev of stacked) {
        if (horizIntersects(cur, prev)) {
          const prevBottom = prev.y + prev.cardHeight/2;
          y = Math.max(y, prevBottom + (cur.cardHeight/2) + GUTTER_Y + 4);
        }
      }
      const halfH = cur.cardHeight/2;
      y = Math.max(SAFE_TOP + halfH, y);
      stacked.push({ ...cur, y, isAbove: y < timelineY });
    }
    rebuilt.splice(0, rebuilt.length, ...stacked);

    // Absolute final pass: enforce global monotonic vertical stacking to eliminate any residual overlaps
    const globallySorted = [...rebuilt].sort((a,b) => (a.y - b.y) || (a.x - b.x));
    const monotonic: PositionedEvent[] = [];
    let lastBottom = -Infinity;
    for (const cur of globallySorted) {
      const halfH = cur.cardHeight/2;
      let y = Math.max(SAFE_TOP + halfH, cur.y);
      if (lastBottom !== -Infinity) {
        y = Math.max(y, lastBottom + GUTTER_Y + 6 + halfH);
      }
      monotonic.push({ ...cur, y, isAbove: y < timelineY });
      lastBottom = y + halfH;
    }
    rebuilt.splice(0, rebuilt.length, ...monotonic);

    // Emergency fallback: if any overlaps somehow persist, force a single vertical list
    if (overlapPairs().length > 0) {
      const listed: PositionedEvent[] = [];
      let yCursor = SAFE_TOP;
      const order = [...rebuilt].sort((a,b) => (a.anchorX - b.anchorX) || (a.y - b.y));
      for (const it of order) {
        const halfH = it.cardHeight/2;
        yCursor = Math.max(yCursor, SAFE_TOP + halfH);
        listed.push({ ...it, y: yCursor, isAbove: yCursor < timelineY });
        yCursor += it.cardHeight + GUTTER_Y + 6;
      }
      rebuilt.splice(0, rebuilt.length, ...listed);
    }

  const byId: Record<string, PositionedEvent> = Object.fromEntries(rebuilt.map(e => [e.id, e]));
  return uniqueItems.map(e => byId[e.id] || e);
  };

  const positionedResolved = resolveOverlaps(allPositionedEvents);

  // Post-render DOM-based collision nudge as a last resort in E2E
  const [yNudges, setYNudges] = React.useState<Record<string, number>>({});
  const nudgeIterRef = React.useRef(0);
  React.useEffect(() => {
    // Read DOM boxes and separate any overlaps by nudging Y in 6px increments
    const cards = Array.from(document.querySelectorAll('[data-testid="event-card"]')) as HTMLElement[];
    const getRect = (el: HTMLElement) => el.getBoundingClientRect();
    const overlap = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const next = { ...yNudges } as Record<string, number>;
    let changed = false;
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const A = cards[i], B = cards[j];
        const ra = getRect(A), rb = getRect(B);
        if (overlap(ra, rb)) {
          const idA = A.getAttribute('data-event-id') || '';
          const idB = B.getAttribute('data-event-id') || '';
          // Push the lower card further down by small step
          const target = (ra.top <= rb.top) ? idB : idA;
          if (target) {
            next[target] = (next[target] || 0) + 8;
            changed = true;
          }
        }
      }
    }
    if (changed && nudgeIterRef.current < 20) {
      nudgeIterRef.current += 1;
      setYNudges(next);
    } else if (!changed) {
      nudgeIterRef.current = 0; // reset when stable
    }
  }, [allPositionedEvents.length, size.width, size.height, yNudges]);
  // Calculate metrics for development display
  const totalEvents = visibleEvents.length;
  const positionedCount = allPositionedEvents.length;
  const utilizationRate = totalEvents > 0 ? ((positionedCount / totalEvents) * 100).toFixed(1) : '0';
  
  // Determine current attempt type
  const currentAttempt = allPositionedEvents.length > 0 ? 
    allPositionedEvents[0].attemptType || 'fallback' : 'none';
  
  // Debug overlay: keep non-interactive to avoid intercepting clicks in tests

  // Telemetry: expose dispatch, capacity, and placements on window for tests and overlays
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Final positions after DOM nudge adjustments
    const finalPositions = positionedResolved.map(ev => ({
      ...ev,
      y: ev.y + (yNudges[String(ev.id)] || 0)
    }));

    // Dispatch metrics
    const clusterSizes = timeClusters.map(c => c.events.length);
    const groupsCount = timeClusters.length;
    const avgEventsPerCluster = groupsCount > 0
      ? (clusterSizes.reduce((a, b) => a + b, 0) / groupsCount)
      : 0;
    const largestCluster = Math.max(0, ...clusterSizes);
    // Neighbor pitch (px) across anchors
    const xs = [...timeClusters].map(c => c.anchor.x).sort((a, b) => a - b);
    const pitches = xs.length > 1 ? xs.slice(1).map((x, i) => Math.abs(x - xs[i])) : [];
    const pitchStats = {
      min: pitches.length ? Math.min(...pitches) : 0,
      max: pitches.length ? Math.max(...pitches) : 0,
      avg: pitches.length ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0
    };

    // Capacity model (coarse, normalized): estimate rows per side using a canonical height
    // Choose a representative card height similar to compact plus gutter to stabilize across datasets
    const AXIS_CLEAR_TELE = 20;
    const GUTTER_Y_TELE = 20;
    const representativeHeight = 96; // px
    const rowHeight = representativeHeight + GUTTER_Y_TELE;
    const maxRowsPerSide = Math.max(1, Math.floor(((containerHeight / 2) - AXIS_CLEAR_TELE - 20) / rowHeight));
    const perColumnCapacity = maxRowsPerSide * 2; // above + below
    const maxColumns = 2; // matches MAX_COLS used in placement
    const totalCells = Math.max(0, groupsCount * perColumnCapacity * maxColumns);
    const usedCells = Math.min(finalPositions.length, totalCells);
    const utilization = totalCells > 0 ? (usedCells / totalCells) * 100 : 0;

    // Placements snapshot for stability checks
    const placements = finalPositions.map(p => ({
      id: String(p.id),
      x: Math.round(p.x),
      y: Math.round(p.y),
      clusterId: String(p.clusterId),
      isAbove: Boolean(p.isAbove)
    }));

    // Compute migrations vs previous snapshot (best-effort)
    const prev = (window as unknown as Record<string, unknown>).__ccTelemetry as { placements?: { items: Array<{ id: string; x?: number; y?: number; clusterId?: string }> } } | undefined;
    let migrations = 0;
    if (prev && Array.isArray(prev.placements?.items)) {
      const prevMap: Map<string, { x?: number; y?: number; clusterId?: string }> = new Map(prev.placements.items.map((it: { id: string; x?: number; y?: number; clusterId?: string }) => [String(it.id), it]));
      for (const cur of placements) {
        const old = prevMap.get(String(cur.id));
        if (!old) continue;
        const movedFar = Math.abs((old.x ?? 0) - cur.x) > 40 || Math.abs((old.y ?? 0) - cur.y) > Math.max(20, Math.round(rowHeight / 2));
        const clusterChanged = String(old.clusterId) !== String(cur.clusterId);
        if (movedFar || clusterChanged) migrations++;
      }
    }

    const telemetry = {
      version: 'v5',
      events: {
        total: totalEvents
      },
      groups: {
        count: groupsCount
      },
      dispatch: {
        avgEventsPerCluster,
        largestCluster,
        groupPitchPx: pitchStats,
        targetAvgEventsPerClusterBand: [4, 6] as [number, number]
      },
      capacity: {
        totalCells,
        usedCells,
        utilization,
        perColumnCapacity,
        maxRowsPerSide,
        maxColumns
      },
      placements: {
        items: placements,
        migrations
      },
      viewport: {
        width: containerWidth,
        height: containerHeight,
        timelineY
      }
    };

    (window as unknown as Record<string, unknown>).__ccTelemetry = telemetry;
  }, [
    positionedResolved,
    yNudges,
    timeClusters,
    containerHeight,
    containerWidth,
    totalEvents,
    timelineY
  ]);

  return (
  <div className="w-full h-full bg-gray-50 relative" ref={containerRef} data-testid="timeline-root">
      {/* Development: Metrics Display */}
      <div
        className="absolute top-2 right-2 z-10 text-right group"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          className="text-white px-3 py-2 rounded text-sm font-mono transition-opacity"
          style={{ background: 'rgba(0,0,0,0.6)', opacity: 0.15 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.15'; }}
        >
        <div>Events: {totalEvents} | Cards: {positionedCount} | Clusters: {timeClusters.length}</div>
        <div>Utilization: {utilizationRate}% | Mode: {currentAttempt}</div>
        <div>Columns: Vertical System | Degradation: Independent per cluster</div>
        </div>
      </div>
      
      {/* Horizontal timeline line */}
      <div 
        className="absolute w-full h-0.5 bg-gray-600" 
        style={{ 
          top: timelineY,
          left: timelineLeft,
          width: timelineWidth
        }} 
        data-testid="timeline-axis"
      />
      
      {/* Timeline anchors - git-style dots positioned ON the timeline line */}
      {timeClusters.map((cluster, index) => (
        <div
          key={`anchor-${index}`}
          className="absolute"
          style={{
            left: cluster.anchor.x - 5, // Center the 10px dot
            top: cluster.anchor.y - 5, // Center on timeline
            zIndex: 10
          }}
          data-testid="timeline-anchor"
        >
          {/* Git-style circular dot - positioned exactly on timeline */}
          <div
            className="w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-blue-700 shadow-md"
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), 0 0 0 2px white'
            }}
          />

          {/* Event count badge */}
          {cluster.events.length > 1 && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm"
              style={{ fontSize: '10px' }}
            >
              {cluster.events.length}
            </div>
          )}
        </div>
      ))}
      
  {/* Development: Column Slot Visualization as placeholders (dev-only) */}
  {devEnabled && placeholderMode !== 'off' && timeClusters.map((cluster, clusterIndex) => {
        // Derive placeholder size from current attempt
    const attempt = (positionedResolved[0]?.attemptType) || 'full';
        const w = attempt === 'full' ? 256 : attempt === 'compact' ? 176 : 140;
        const h = attempt === 'full' ? 96 : attempt === 'compact' ? 64 : 32;
  const GUTTER_Y = 10;
  const AXIS_CLEAR_ADJ = 20;
  const ROW_HEIGHT = h + GUTTER_Y;
  const MAX_ROWS_PER_SIDE = Math.max(0, Math.floor(((containerHeight / 2) - AXIS_CLEAR_ADJ - 20) / ROW_HEIGHT));
        const rowsToShow = placeholderMode === 'dense' ? MAX_ROWS_PER_SIDE : Math.min(2, MAX_ROWS_PER_SIDE);
  const GUTTER_X = 12;
  const COLUMN_SPACING = Math.max(w * 0.8 + GUTTER_X, w + GUTTER_X);
        const columns = placeholderMode === 'dense' ? [0, -1, 1, -2, 2, -3, 3] : [0, -1, 1];

        type Rect = { x: number; y: number; width: number; height: number };
        const emitted: Rect[] = [];
        const collide = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

  const placeholders: React.ReactElement[] = [];
        for (let side = 0; side < 2; side++) { // 0=above,1=below
          for (let row = 0; row < rowsToShow; row++) {
            const isAbove = side === 0;
            const baseY = isAbove
              ? (cluster.anchor.y - AXIS_CLEAR_ADJ) - h - row * ROW_HEIGHT - 10
              : (cluster.anchor.y + AXIS_CLEAR_ADJ) + row * ROW_HEIGHT + 10;
            for (const col of columns) {
              const cx = cluster.anchor.x + (col === 0 ? 0 : (col < 0 ? -Math.ceil(Math.abs(col)) : Math.ceil(col)) * COLUMN_SPACING * (col < 0 ? 1 : 1));
              const topLeftX = Math.max(10, Math.min(containerWidth - w - 10, cx - w / 2));
              const topLeftY = Math.max(10, Math.min(containerHeight - h - 10, baseY));
              const phRect: Rect = { x: topLeftX, y: topLeftY, width: w, height: h };

              // Skip if overlaps a real card
              const overlapsCard = positionedResolved.some(ev => {
                const r: Rect = { x: ev.x - ev.cardWidth / 2, y: ev.y - ev.cardHeight / 2, width: ev.cardWidth, height: ev.cardHeight };
                return collide(phRect, r);
              });
              if (overlapsCard) continue;

              // Skip if overlaps previously emitted placeholders (dense mode)
              if (placeholderMode === 'dense' && emitted.some(e => collide(phRect, e))) continue;

              emitted.push(phRect);
              placeholders.push(
                <div
                  key={`${clusterIndex}-${side}-${row}-${col}`}
                  className="absolute rounded-lg border border-dashed"
                  style={{
                    left: phRect.x + phRect.width / 2,
                    top: phRect.y + phRect.height / 2,
                    width: w,
                    height: h,
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.25,
                    background: 'transparent',
                    zIndex: 5,
                    pointerEvents: 'none'
                  }}
                  aria-hidden
                  title={`Placeholder`}
                />
              );
            }
          }
        }

        return placeholders;
      })}
      
      {/* Event cards */}
  {positionedResolved.map((event) => (
        <Node
          key={event.id}
          id={event.id}
          title={event.title}
          description={event.description}
          date={event.date}
          x={event.x}
          y={event.y + (yNudges[String(event.id)] || 0)}
          isSelected={selectedId === event.id}
          onSelect={onSelect}
          contentDensity={event.attemptType === 'full' ? 'full' : event.attemptType === 'compact' ? 'compact' : 'minimal'}
          cardWidth={event.cardWidth}
          cardHeight={event.cardHeight}
          isMultiEvent={event.isMultiEvent}
          isSummaryCard={event.isSummaryCard}
          clusterId={event.clusterId}
          showDescription={event.showDescription}
          showDate={event.showDate}
          isMultiTitle={event.isMultiEvent}
        />
      ))}
      
      {/* Git-style vertical connector lines from dots to cards */}
      <svg className="absolute inset-0 pointer-events-none">
        {positionedResolved.map((event) => {
          // Determine if card is above or below the axis
          const isAbove = event.y < event.anchorY;

          // Calculate card edge Y position (top or bottom edge)
          const cardEdgeY = isAbove
            ? event.y + (event.cardHeight / 2)  // Bottom edge of card above axis
            : event.y - (event.cardHeight / 2); // Top edge of card below axis

          return (
            <line
              key={`connector-${event.id}`}
              x1={event.anchorX}
              y1={event.anchorY}
              x2={event.anchorX}
              y2={cardEdgeY}
              stroke="#3b82f6"
              strokeWidth="2"
              opacity={0.7}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Timeline;
