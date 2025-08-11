import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Event } from '../types';
import { Node } from '../timeline/Node/Node';
import { SvgDefs } from '../timeline/SvgDefs';
import { Axis } from '../timeline/Axis';
import { RangeBar } from '../timeline/RangeBar';
import { CreateAffordance } from '../timeline/CreateAffordance';
import { useAxisTicks } from '../timeline/hooks/useAxisTicks';
import { useLanes } from '../timeline/hooks/useLanes';
import { dayMs } from '../lib/time';

interface Props {
  events: Event[];
  onSelect?: (id: string) => void;
  selectedId?: string;
  onDragDate?: (id: string, newISODate: string) => void;
  // View window expressed as fractions of the full domain [0..1]
  viewStart?: number; // default 0
  viewEnd?: number;   // default 1
  onViewWindowChange?: (start: number, end: number) => void;
  onInlineEdit?: (id: string, updates: { title: string; description?: string }) => void;
  // New: create-on-track handler
  onCreateAt?: (isoDate: string) => void;
  // New: notify parent when drag starts/ends to pause overlays
  onDragState?: (dragging: boolean) => void;
  // New: accessible announcements
  onAnnounce?: (msg: string) => void;
}

const Timeline: React.FC<Props> = ({
  events,
  onSelect,
  selectedId,
  onDragDate,
  viewStart = 0,
  viewEnd = 1,
  onViewWindowChange,
  onInlineEdit,
  onCreateAt,
  onDragState,
  onAnnounce,
}) => {
  const sorted = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);
  const globalMin0 = sorted.length ? new Date(sorted[0].date).getTime() : Date.now();
  const globalMax0 = sorted.length ? new Date(sorted[sorted.length - 1].date).getTime() : globalMin0 + dayMs;
  const baseRange = Math.max(globalMax0 - globalMin0, dayMs);
  const pad = baseRange * 0.1; // 10% padding to wrap ends
  const domainMin = globalMin0 - pad;
  const domainMax = globalMax0 + pad;
  const domainRange = Math.max(domainMax - domainMin, dayMs);

  const viewMin = domainMin + Math.min(Math.max(viewStart, 0), 1) * domainRange;
  const viewMax = domainMin + Math.min(Math.max(viewEnd, 0), 1) * domainRange;
  const viewRange = Math.max(viewMax - viewMin, dayMs);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewISO, setPreviewISO] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const previewISORef = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Create hint state
  const [createHint, setCreateHint] = useState<{ visible: boolean; x: number; iso: string }>(() => ({ visible: false, x: 0, iso: new Date().toISOString().slice(0,10) }));

  const setOverlayPE = (disable: boolean) => {
    try {
      const el = document.querySelector('aside[role="dialog"]') as HTMLElement | null;
      if (el) {
        if (disable) el.style.setProperty('pointer-events', 'none', 'important');
        else el.style.setProperty('pointer-events', 'auto');
      }
    } catch {}
  };

  const endDrag = React.useCallback(() => {
    const id = draggingIdRef.current;
    const iso = previewISORef.current;
    if (id && iso && onDragDate) {
      onDragDate(id, iso);
      onAnnounce?.(`Date changed to ${iso}`);
    }
    if (id) onDragState?.(false);
    try { document.body?.removeAttribute('data-dragging'); } catch {}
    setOverlayPE(false);
    setDraggingId(null);
    setPreviewISO(null);
    draggingIdRef.current = null;
    previewISORef.current = null;
  }, [onDragDate, onAnnounce, onDragState]);

  // Ensure overlay pointer-events flips immediately on down/up regardless of React batching
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onDown = () => { try { document.body?.setAttribute('data-dragging', '1'); } catch {}; setOverlayPE(true); onDragState?.(true); };
    const onUp = () => { endDrag(); };
    svg.addEventListener('pointerdown', onDown, { capture: true });
    svg.addEventListener('mousedown', onDown, { capture: true });
    window.addEventListener('pointerup', onUp, { capture: true });
    window.addEventListener('mouseup', onUp, { capture: true });
    return () => {
      svg.removeEventListener('pointerdown', onDown, { capture: true } as any);
      svg.removeEventListener('mousedown', onDown, { capture: true } as any);
      window.removeEventListener('pointerup', onUp, { capture: true } as any);
      window.removeEventListener('mouseup', onUp, { capture: true } as any);
    };
  }, [onDragState, endDrag]);

  function tToXPercent(t: number) {
    return ((t - viewMin) / viewRange) * 100;
  }

  function clientXToDateISO(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return new Date(viewMin).toISOString().slice(0, 10);
    const rect = svg.getBoundingClientRect();
    const px = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const pct = rect.width > 0 ? (px / rect.width) * 100 : 0;
    const t = viewMin + (pct / 100) * viewRange;
    const snapped = Math.round(t / dayMs) * dayMs;
    // Clamp to padded domain
    const clamped = Math.min(Math.max(snapped, domainMin), domainMax);
    return new Date(clamped).toISOString().slice(0, 10);
  }

  function handlePointerMoveGeneric(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.height === 0) return; // guard against layout race
    const yUnits = (Math.min(Math.max(clientY - rect.top, 0), rect.height) / rect.height) * 20;
    const near = Math.abs(yUnits - 10) <= 1.2; // broaden threshold for plus affordance
    if (!draggingId && near) {
      const px = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const pct = rect.width > 0 ? (px / rect.width) * 100 : 0;
      const iso = clientXToDateISO(clientX);
      setCreateHint({ visible: !!onCreateAt, x: pct, iso });
    } else if (createHint.visible && !near) {
      setCreateHint(prev => ({ ...prev, visible: false }));
    }
    if (!draggingId) return;
    const iso = clientXToDateISO(clientX);
    if (iso !== previewISO) onAnnounce?.(`Date preview: ${iso}`);
    setPreviewISO(iso);
    previewISORef.current = iso;
  }

  const count = sorted.length;
  const dense = count > 40;
  const veryDense = count > 80;
  const hoverEnabled = count <= 60;
  const densityScale = veryDense ? 0.85 : (dense ? 0.92 : 1);

  // Adaptive ticks/labels based on viewRange; keep ≤12 primary labels
  const tickData = useAxisTicks(viewMin, viewMax, viewRange, tToXPercent);
  const tickStart = 2;
  const tickEnd = 98;

  // Compute t/x for events (respect preview during drag)
  const displayPositions = sorted.map(ev => {
    const baseT = new Date(ev.date).getTime();
    const t = ev.id === draggingId && previewISO ? new Date(previewISO).getTime() : baseT;
    const x = tToXPercent(t);
    return { id: ev.id, t, x };
  });
  // Compute raw event x positions (ignore drag preview) for range bar so it always appears when events exist
  const rawPositions = sorted.map(ev => ({ id: ev.id, x: tToXPercent(new Date(ev.date).getTime()) }));
  const eventXs = rawPositions.map(p => p.x).filter(x => isFinite(x));
  const firstXRaw = eventXs.length ? Math.min(...eventXs) : 50;
  const lastXRaw = eventXs.length ? Math.max(...eventXs) : 50;
  const firstX = Math.max(tickStart, Math.min(tickEnd, firstXRaw));
  const lastX = Math.max(tickStart, Math.min(tickEnd, lastXRaw));

  const laneShiftById = useLanes(displayPositions, dense, veryDense);

  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 260 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 20"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="max-w-none"
        onPointerDownCapture={(e) => {
          const id = (e.target as HTMLElement | null)?.getAttribute('data-event-id');
          if (id) {
            const ev = events.find(x => x.id === id); if (ev) {
              setDraggingId(id); setPreviewISO(ev.date); draggingIdRef.current = id; previewISORef.current = ev.date;
              try { document.body?.setAttribute('data-dragging', '1'); } catch {}
              onDragState?.(true); setOverlayPE(true);
            }
          }
        }}
        onMouseMove={(e) => handlePointerMoveGeneric(e.clientX, e.clientY)}
        onPointerMove={(e) => handlePointerMoveGeneric(e.clientX, e.clientY)}
        onMouseLeave={() => { endDrag(); setHoveredId(null); setCreateHint(prev => ({ ...prev, visible: false })); }}
        onPointerLeave={() => { endDrag(); setHoveredId(null); setCreateHint(prev => ({ ...prev, visible: false })); }}
        onWheel={(e) => {
          if (!onViewWindowChange) return; e.preventDefault();
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
          const f = rect.width > 0 ? px / rect.width : 0.5;
          const currentWidth = Math.max(viewEnd - viewStart, 0.01);
          const zoomIntensity = 0.15;
          const dir = e.deltaY > 0 ? 1 : -1;
          const scale = 1 + dir * zoomIntensity;
          let newWidth = Math.max(0.02, Math.min(1, currentWidth * scale));
          const target = viewStart + f * currentWidth;
          let newStart = target - f * newWidth; let newEnd = newStart + newWidth;
          if (newStart < 0) { newEnd -= newStart; newStart = 0; }
          if (newEnd > 1) { newStart -= newEnd - 1; newEnd = 1; }
          onViewWindowChange(newStart, newEnd);
        }}
        onPointerUp={() => endDrag()}
        onMouseUp={() => endDrag()}
      >
        <SvgDefs />
        <Axis ticks={tickData} tickStart={tickStart} tickEnd={tickEnd} viewMin={viewMin} viewMax={viewMax} />
        <RangeBar hasEvents={events.length > 0} firstX={firstX} lastX={lastX} />
        {sorted.map((ev, i) => {
          const baseT = new Date(ev.date).getTime();
          const t = ev.id === draggingId && previewISO ? new Date(previewISO).getTime() : baseT;
          const x = tToXPercent(t);
          const above = i % 2 === 0;
          const isSelected = ev.id === selectedId;
          const isEditing = editingId === ev.id;
          const isHover = hoverEnabled && hoveredId === ev.id;
          const isExpanded = isSelected || isEditing || isHover;
          const showLabel = !dense || isSelected || ev.id === draggingId || isHover;
          const faded = dense && !(isSelected || isHover || ev.id === draggingId);
          const opacity = veryDense ? (faded ? 0.45 : 1) : (dense ? (faded ? 0.7 : 1) : 1);
          const displayDate = (ev.id === draggingId && previewISO) ? new Date(new Date(previewISO).getTime()).toISOString().slice(0,10) : ev.date;
          const laneShift = laneShiftById.get(ev.id) || 0;
          return (
            <Node
              key={ev.id}
              id={ev.id}
              x={x}
              date={ev.date}
              displayDate={displayDate}
              title={ev.title}
              description={ev.description}
              above={above}
              laneShift={laneShift}
              scale={densityScale}
              isSelected={isSelected}
              isExpanded={isExpanded}
              isEditing={isEditing}
              showLabel={showLabel}
              opacity={opacity}
              draggable={!!onDragDate}
              onSelect={onSelect}
              onStartDrag={(id) => {
                setHoveredId(null); setDraggingId(id); setPreviewISO(ev.date); draggingIdRef.current = id; previewISORef.current = ev.date; try { document.body?.setAttribute('data-dragging', '1'); } catch {}; onDragState?.(true);
              }}
              onStartInlineEdit={(id) => { setHoveredId(null); setEditingId(id); }}
              onSaveInlineEdit={(id, updates) => { setEditingId(null); onInlineEdit?.(id, updates); }}
              onCancelInlineEdit={() => setEditingId(null)}
              onHoverChange={(hovered) => setHoveredId(hovered ? ev.id : (hoveredId === ev.id ? null : hoveredId))}
              onNudge={(id, deltaDays) => {
                const base = new Date(ev.date).getTime();
                const t = base + deltaDays * dayMs;
                const iso = new Date(t).toISOString().slice(0,10);
                setPreviewISO(iso); setDraggingId(id);
                onAnnounce?.(`Date changed to ${iso}`);
                onDragDate?.(id, iso);
                setTimeout(() => { setDraggingId(null); setPreviewISO(null); }, 0);
              }}
            />
          );
        })}
        <CreateAffordance visible={!!onCreateAt && createHint.visible} x={createHint.x} iso={createHint.iso} onCreateAt={onCreateAt} />
      </svg>
    </div>
  );
};

export default Timeline;
