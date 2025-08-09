import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Event } from '../types';

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
}

const dayMs = 24 * 60 * 60 * 1000;

// Memoized node/card to avoid re-rendering unchanged nodes
const Node = React.memo(function Node({
  id,
  x,
  date,
  title,
  description,
  above,
  isSelected,
  isEditing,
  showLabel,
  draggable,
  onSelect,
  onStartDrag,
  onStartInlineEdit,
  onSaveInlineEdit,
  onCancelInlineEdit,
}: {
  id: string;
  x: number;
  date: string;
  title: string;
  description?: string;
  above: boolean;
  isSelected: boolean;
  isEditing: boolean;
  showLabel: boolean;
  draggable: boolean;
  onSelect?: (id: string) => void;
  onStartDrag?: (id: string) => void;
  onStartInlineEdit?: (id: string) => void;
  onSaveInlineEdit?: (id: string, updates: { title: string; description?: string }) => void;
  onCancelInlineEdit?: () => void;
}) {
  const stemY2 = above ? 4 : 16;
  const labelY = above ? 3 : 17.5;
  const stemY1 = above ? 9.1 : 10.9; // start stem at node boundary

  // Card metrics in viewBox units
  const collapsedW = 18;
  const collapsedH = 4.2;
  const expandedW = 28;
  const expandedH = 8.5;
  const pad = 0.8;

  const cardW = isSelected ? expandedW : collapsedW;
  const cardH = isSelected ? expandedH : collapsedH;
  const cardX = Math.max(1, Math.min(99 - cardW, x - cardW / 2));
  const cardBottomY = labelY; // anchor at label position
  const cardY = above ? cardBottomY - cardH : cardBottomY; // above: card ends at label; below: starts at label

  // Inline edit state
  const [etitle, setETitle] = useState(title);
  const [edesc, setEDesc] = useState(description ?? '');
  useEffect(() => { if (isEditing) { setETitle(title); setEDesc(description ?? ''); } }, [isEditing, title, description]);

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Event: ${date} — ${title}`}
      onClick={() => onSelect?.(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(id);
        }
      }}
      style={{ cursor: draggable ? ('pointer' as const) : 'default' }}
    >
      <title>{`${date} — ${title}`}</title>
      {/* node */}
      {(() => {
        const centeredX = Math.max(0.9, Math.min(99.1, x));
        const rectX = centeredX - 0.9;
        return (
          <rect
            x={rectX}
            y={9.1}
            width={1.8}
            height={1.8}
            fill={isSelected ? '#ffffff' : '#f3f4f6'}
            stroke={isSelected ? '#2563eb' : '#9ca3af'}
            strokeWidth={isSelected ? 0.5 : 0.3}
            rx={0.2}
            data-event-id={id}
            data-title={title}
            style={{ cursor: draggable ? ('grab' as const) : 'default', filter: isSelected ? 'url(#selGlow)' : undefined, pointerEvents: 'all' }}
            onMouseDown={() => {
              if (!draggable) return;
              onStartDrag?.(id);
            }}
          />
        );
      })()}
      {/* stem from node boundary to card anchor */}
      <line x1={x} y1={stemY1} x2={x} y2={stemY2} stroke="#94a3b8" strokeWidth={0.25} />

      {/* card: collapsed or expanded; honor density via showLabel */}
      {showLabel && (
        <g>
          <rect
            x={cardX}
            y={cardY}
            width={cardW}
            height={cardH}
            rx={0.8}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={0.25}
          />
          {/* title */}
          <text x={cardX + pad} y={cardY + pad + 1.6} fontSize={1.6} fill="#0f172a">
            {title}
          </text>
          {/* Inline edit trigger when selected */}
          {isSelected && !isEditing && (
            <text
              role="button"
              aria-label="Edit inline"
              x={cardX + cardW - pad}
              y={cardY + pad + 1.6}
              textAnchor="end"
              fontSize={1.2}
              fill="#2563eb"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onStartInlineEdit?.(id); }}
            >
              ✏ Edit
            </text>
          )}

          {/* expanded details or inline editor */}
          {isSelected && !isEditing && (
            <>
              <text x={cardX + pad} y={cardY + pad + 3.4} fontSize={1.2} fill="#475569">{date}</text>
              {description && (
                <text x={cardX + pad} y={cardY + pad + 5.2} fontSize={1.2} fill="#334155">
                  {description}
                </text>
              )}
            </>
          )}

          {isSelected && isEditing && (
            <foreignObject x={cardX} y={cardY} width={cardW} height={cardH} requiredExtensions="http://www.w3.org/1999/xhtml">
              <div
                style={{ fontSize: 12, fontFamily: 'ui-sans-serif, system-ui', padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  aria-label="Inline Title"
                  type="text"
                  value={etitle}
                  onChange={(e) => setETitle((e.target as HTMLInputElement).value)}
                  style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
                <input
                  aria-label="Inline Description"
                  type="text"
                  placeholder="Optional"
                  value={edesc}
                  onChange={(e) => setEDesc((e.target as HTMLInputElement).value)}
                  style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); }}
                    style={{ background: '#059669', color: 'white', padding: '4px 8px', borderRadius: 6 }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCancelInlineEdit?.(); }}
                    style={{ background: '#e5e7eb', color: '#111827', padding: '4px 8px', borderRadius: 6 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </foreignObject>
          )}
        </g>
      )}
    </g>
  );
});

const Timeline: React.FC<Props> = ({
  events,
  onSelect,
  selectedId,
  onDragDate,
  viewStart = 0,
  viewEnd = 1,
  onViewWindowChange,
  onInlineEdit,
}) => {
  const sorted = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);
  const globalMin = sorted.length ? new Date(sorted[0].date).getTime() : Date.now();
  const globalMax = sorted.length ? new Date(sorted[sorted.length - 1].date).getTime() : globalMin + dayMs;
  const globalRange = Math.max(globalMax - globalMin, dayMs);

  const viewMin = globalMin + Math.min(Math.max(viewStart, 0), 1) * globalRange;
  const viewMax = globalMin + Math.min(Math.max(viewEnd, 0), 1) * globalRange;
  const viewRange = Math.max(viewMax - viewMin, dayMs);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewISO, setPreviewISO] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    // Clamp to global domain to avoid preview outside bounds
    const clamped = Math.min(Math.max(snapped, globalMin), globalMax);
    return new Date(clamped).toISOString().slice(0, 10);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!draggingId) return;
    const iso = clientXToDateISO(e.clientX);
    setPreviewISO(iso);
  }

  function handleMouseUp() {
    if (draggingId && previewISO && onDragDate) {
      onDragDate(draggingId, previewISO);
    }
    setDraggingId(null);
    setPreviewISO(null);
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    if (!onViewWindowChange) return;
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const f = rect.width > 0 ? px / rect.width : 0.5; // fraction within current view
    const currentWidth = Math.max(viewEnd - viewStart, 0.01);
    const zoomIntensity = 0.15; // smaller = gentler zoom
    const dir = e.deltaY > 0 ? 1 : -1; // wheel down => zoom out
    const scale = 1 + dir * zoomIntensity;
    let newWidth = Math.max(0.02, Math.min(1, currentWidth * scale));

    const target = viewStart + f * currentWidth; // target position in global fraction
    let newStart = target - f * newWidth;
    let newEnd = newStart + newWidth;

    // clamp to [0,1]
    if (newStart < 0) {
      newEnd -= newStart;
      newStart = 0;
    }
    if (newEnd > 1) {
      newStart -= newEnd - 1;
      newEnd = 1;
    }

    onViewWindowChange(newStart, newEnd);
  }

  const count = sorted.length;
  const dense = count > 40;

  // Build simple evenly spaced tick marks for visual rhythm
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 260 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 20"
        width="100%"
        height="300"
        preserveAspectRatio="none"
        className="max-w-4xl"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="selGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* subtle ticks */}
        {ticks.map((pct) => (
          <line key={pct} x1={pct} y1={9.4} x2={pct} y2={10.6} stroke="#e5e7eb" strokeWidth={0.25} />
        ))}
        {/* main track */}
        <line x1="0" y1="10" x2="100" y2="10" stroke="url(#timelineGradient)" strokeWidth="3" strokeLinecap="round" />
        {/* edge labels */}
        <text x={0} y={19.3} textAnchor="start" fontSize={1.4} fill="#64748b">
          {new Date(viewMin).toISOString().slice(0, 10)}
        </text>
        <text x={100} y={19.3} textAnchor="end" fontSize={1.4} fill="#64748b">
          {new Date(viewMax).toISOString().slice(0, 10)}
        </text>
        {sorted.map((ev, i) => {
          const baseT = new Date(ev.date).getTime();
          const t = ev.id === draggingId && previewISO ? new Date(previewISO).getTime() : baseT;
          const x = tToXPercent(t);
          const above = i % 2 === 0;
          const isSelected = ev.id === selectedId;
          const showLabel = !dense || isSelected || ev.id === draggingId;
          const isEditing = editingId === ev.id;
          return (
            <Node
              key={ev.id}
              id={ev.id}
              x={x}
              date={ev.date}
              title={ev.title}
              description={ev.description}
              above={above}
              isSelected={isSelected}
              isEditing={isEditing}
              showLabel={showLabel}
              draggable={!!onDragDate}
              onSelect={onSelect}
              onStartDrag={(id) => {
                setEditingId(null);
                setDraggingId(id);
                setPreviewISO(ev.date);
              }}
              onStartInlineEdit={(id) => setEditingId(id)}
              onSaveInlineEdit={(id, updates) => {
                setEditingId(null);
                onInlineEdit?.(id, updates);
              }}
              onCancelInlineEdit={() => setEditingId(null)}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Timeline;
