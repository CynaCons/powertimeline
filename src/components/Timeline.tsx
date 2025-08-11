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
  // New: create-on-track handler
  onCreateAt?: (isoDate: string) => void;
  // New: notify parent when drag starts/ends to pause overlays
  onDragState?: (dragging: boolean) => void;
  // New: accessible announcements
  onAnnounce?: (msg: string) => void;
}

const dayMs = 24 * 60 * 60 * 1000;

// Memoized node/card to avoid re-rendering unchanged nodes
const Node = React.memo(function Node({
  id,
  x,
  date,
  displayDate,
  title,
  description,
  above,
  laneShift,
  scale,
  isSelected,
  isExpanded,
  isEditing,
  showLabel,
  opacity,
  draggable,
  onSelect,
  onStartDrag,
  onStartInlineEdit,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onHoverChange,
  onNudge,
}: {
  id: string;
  x: number;
  date: string; // canonical stored date
  displayDate: string; // date shown near anchor (updates on drag)
  title: string;
  description?: string;
  above: boolean;
  laneShift: number; // vertical separation within clusters
  scale: number; // density-aware scaling 0.8..1
  isSelected: boolean;
  isExpanded: boolean;
  isEditing: boolean;
  showLabel: boolean;
  opacity: number;
  draggable: boolean;
  onSelect?: (id: string) => void;
  onStartDrag?: (id: string) => void;
  onStartInlineEdit?: (id: string) => void;
  onSaveInlineEdit?: (id: string, updates: { title: string; description?: string }) => void;
  onCancelInlineEdit?: () => void;
  onHoverChange?: (hovered: boolean) => void;
  onNudge?: (id: string, deltaDays: number) => void;
}) {
  // Bring cards a bit further from the centerline for clearer separation
  const baseLabelY = above ? 6.0 : 14.0;
  const labelY = above ? Math.max(4.5, baseLabelY - laneShift) : Math.min(15.5, baseLabelY + laneShift);

  // Anchor size and alignment with track (y=10)
  const anchorSize = 1.0;
  const anchorY = 10 - anchorSize / 2; // rect y used for both above/below visually centered on track
  const stemStartY = above ? 10 - anchorSize / 2 : 10 + anchorSize / 2;

  // Card metrics (square corners, tighter) with density-aware scaling
  const collapsedW = 16 * scale;
  const collapsedH = 3.8 * scale;
  const expandedW = 26 * Math.max(0.9, scale);
  const expandedH = 7.6 * Math.max(0.9, scale);
  const pad = 0.6 * scale;

  const cardW = isExpanded ? expandedW : collapsedW;
  const cardH = isExpanded ? expandedH : collapsedH;
  const cardX = Math.max(2, Math.min(98 - cardW, x - cardW / 2));
  const cardBottomY = labelY;
  const rawCardY = above ? cardBottomY - cardH : cardBottomY;
  const cardY = Math.max(1, Math.min(19 - cardH, rawCardY));

  // Inline edit state
  const [etitle, setETitle] = useState(title);
  const [edesc, setEDesc] = useState(description ?? '');
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { if (isEditing) { setETitle(title); setEDesc(description ?? ''); } }, [isEditing, title, description]);
  useEffect(() => { if (isEditing && titleInputRef.current) { titleInputRef.current.focus(); titleInputRef.current.select?.(); } }, [isEditing]);

  // Connector (straight), BF-style with square endpoint at card side
  const anchorYForPath = above ? cardY + cardH : cardY;
  const endXRaw = Math.max(cardX + pad, Math.min(cardX + cardW - pad, x));
  const endX = Math.abs(endXRaw - x) < 0.05 ? endXRaw + 0.05 : endXRaw;
  const connectorPath = `M ${x} ${stemStartY} L ${endX} ${anchorYForPath}`;
  const connectorColor = '#74c7ec';
  const connectorOpacity = Math.max(opacity, 0.92);

  // Simple string truncation to avoid overflow (approximate mono/body char width)
  function truncateMono(s: string, width: number, fontSize: number) {
    const charW = 0.6 * fontSize; // approx
    const maxChars = Math.max(4, Math.floor((width - pad * 2) / charW));
    return s.length > maxChars ? s.slice(0, Math.max(0, maxChars - 1)) + '…' : s;
  }
  function truncateBody(s: string, width: number, fontSize: number) {
    const charW = 0.55 * fontSize; // approx
    const maxChars = Math.max(6, Math.floor((width - pad * 2) / charW));
    return s.length > maxChars ? s.slice(0, Math.max(0, maxChars - 1)) + '…' : s;
  }

  // Typography sizes (scaled)
  const titleSize = 1.2 * Math.max(0.9, scale);
  const bodySize = 1.0 * Math.max(0.9, scale);

  // ClipPath to keep content inside the card rect (no bleed)
  const clipId = `clip-${id}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Event: ${date} — ${title}`}
      onClick={() => { onSelect?.(id); onHoverChange?.(false); }}
      onDoubleClick={() => { onSelect?.(id); onStartInlineEdit?.(id); onHoverChange?.(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isEditing) {
            onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined });
          } else {
            onSelect?.(id);
            onStartInlineEdit?.(id);
          }
          onHoverChange?.(false);
        } else if (e.key === ' ') {
          e.preventDefault();
          onSelect?.(id);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          if (!draggable) return;
          e.preventDefault();
          const delta = (e.shiftKey ? 7 : 1) * (e.key === 'ArrowLeft' ? -1 : 1);
          onNudge?.(id, delta);
        }
      }}
      // Start drag when pressing anywhere on the node (not just the tiny anchor)
      onPointerDown={(e) => {
        if (!draggable || isEditing) return;
        try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}
        onStartDrag?.(id);
        onHoverChange?.(false);
      }}
      onMouseDown={() => {
        if (!draggable || isEditing) return;
        onStartDrag?.(id);
        onHoverChange?.(false);
      }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      style={{ cursor: draggable ? ('pointer' as const) : 'default' }}
    >
      <title>{`${date} — ${title}`}</title>
      {/* anchor (square, no stroke) */}
      {(() => {
        const centeredX = Math.max(anchorSize / 2, Math.min(100 - anchorSize / 2, x));
        const rectX = centeredX - anchorSize / 2;
        return (
          <rect
            x={rectX}
            y={anchorY}
            width={anchorSize}
            height={anchorSize}
            fill={isSelected ? '#1d4ed8' : '#e2e8f0'}
            stroke="none"
            rx={0}
            data-event-id={id}
            data-title={title}
            style={{ cursor: draggable ? ('grab' as const) : 'default', filter: isSelected ? 'url(#selGlow)' : undefined, pointerEvents: 'all', fillOpacity: isSelected ? 1 : Math.max(0.85, opacity) }}
            onPointerDown={(e) => {
              if (!draggable) return;
              try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}
              onStartDrag?.(id);
              onHoverChange?.(false);
            }}
            onMouseDown={() => {
              if (!draggable) return;
              onStartDrag?.(id);
              onHoverChange?.(false);
            }}
            onClick={() => { onSelect?.(id); onHoverChange?.(false); }}
            onDoubleClick={() => { onSelect?.(id); onStartInlineEdit?.(id); onHoverChange?.(false); }}
          />
        );
      })()}

      {/* date near anchor - always visible; updates during drag */}
      <text x={x} y={above ? 8.1 : 12.1} textAnchor="middle" fontSize={0.85} fill="#64748b" data-testid="anchor-date" style={{ fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        {displayDate}
      </text>

      {/* connector */}
      <g opacity={connectorOpacity}>
        <path d={connectorPath} stroke={connectorColor} strokeWidth={0.35} fill="none" shapeRendering="geometricPrecision" />
        {/* square endpoint at card side */}
        <rect x={endX - 0.35} y={anchorYForPath - 0.35} width={0.7} height={0.7} fill={connectorColor} stroke="#0e1624" strokeWidth={0.1} />
      </g>

      {/* card */}
      {showLabel && (
        <g opacity={opacity}>
          <defs>
            <clipPath id={clipId}>
              <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={0} />
            </clipPath>
          </defs>
          <rect
            x={cardX}
            y={cardY}
            width={cardW}
            height={cardH}
            rx={0}
            fill="#0b1220"
            stroke="#3a4b5f"
            strokeWidth={0.2}
            filter="url(#cardShadow)"
          />
          {/* header/body divider */}
          <line x1={cardX} y1={cardY + pad + titleSize + 0.5} x2={cardX + cardW} y2={cardY + pad + titleSize + 0.5} stroke="#1f2b3a" strokeWidth={0.15} />
          {/* title */}
          <text x={cardX + pad} y={cardY + pad + titleSize} fontSize={titleSize} fill="#e5eef9" style={{ fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: 0.2 }}>
            {truncateMono(title, cardW, titleSize)}
          </text>
          {/* description - render when provided; editable state hides it */}
          {description && !isEditing && (
            <g clipPath={`url(#${clipId})`}>
              <text x={cardX + pad} y={cardY + pad + titleSize + 1.8} fontSize={bodySize} fill="#acbdce" data-testid="card-description" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
                {truncateBody(description, cardW, bodySize)}
              </text>
            </g>
          )}

          {isSelected && isEditing && (
            <foreignObject x={cardX} y={cardY} width={cardW} height={cardH} requiredExtensions="http://www.w3.org/1999/xhtml">
              <div
                style={{ fontSize: 12, fontFamily: 'ui-sans-serif, system-ui', padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { e.stopPropagation(); onCancelInlineEdit?.(); }
                  if (e.key === 'Enter') { e.stopPropagation(); onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); }
                }}
                onBlur={(e) => {
                  // save on blur if focus leaves the editing container
                  const current = e.currentTarget as HTMLElement;
                  setTimeout(() => {
                    if (!current.contains(document.activeElement)) {
                      onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined });
                    }
                  }, 0);
                }}
              >
                <input
                  ref={titleInputRef}
                  aria-label="Inline Title"
                  type="text"
                  value={etitle}
                  onChange={(e) => setETitle((e.target as HTMLInputElement).value)}
                  style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                />
                <input
                  aria-label="Inline Description"
                  type="text"
                  placeholder="Optional"
                  value={edesc}
                  onChange={(e) => setEDesc((e.target as HTMLInputElement).value)}
                  style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); }}
                    style={{ background: '#059669', color: 'white', padding: '4px 8px', borderRadius: 4 }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCancelInlineEdit?.(); }}
                    style={{ background: '#e5e7eb', color: '#111827', padding: '4px 8px', borderRadius: 4 }}
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
    const onDown = (_e: any) => {
      try { document.body?.setAttribute('data-dragging', '1'); } catch {}
      setOverlayPE(true);
      onDragState?.(true);
    };
    const onUp = () => {
      endDrag();
    };
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

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    // create-hint tracking when near center line
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const yUnits = (Math.min(Math.max(e.clientY - rect.top, 0), rect.height) / rect.height) * 20;
      const near = Math.abs(yUnits - 10) <= 0.7; // ~0.7 viewBox units near the center line
      if (!draggingId && near) {
        const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        const pct = rect.width > 0 ? (px / rect.width) * 100 : 0;
        const iso = clientXToDateISO(e.clientX);
        setCreateHint({ visible: !!onCreateAt, x: pct, iso });
      } else if (createHint.visible) {
        setCreateHint((prev) => ({ ...prev, visible: false }));
      }
    }

    if (!draggingId) return;
    const iso = clientXToDateISO(e.clientX);
    if (iso !== previewISO) onAnnounce?.(`Date preview: ${iso}`);
    setPreviewISO(iso);
    previewISORef.current = iso;
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (svg && !draggingId) {
      const rect = svg.getBoundingClientRect();
      const yUnits = (Math.min(Math.max(e.clientY - rect.top, 0), rect.height) / rect.height) * 20;
      const near = Math.abs(yUnits - 10) <= 0.7;
      if (near) {
        const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        const pct = rect.width > 0 ? (px / rect.width) * 100 : 0;
        const iso = clientXToDateISO(e.clientX);
        setCreateHint({ visible: !!onCreateAt, x: pct, iso });
      } else if (createHint.visible) {
        setCreateHint((prev) => ({ ...prev, visible: false }));
      }
    }
    if (!draggingId) return;
    const iso = clientXToDateISO(e.clientX);
    if (iso !== previewISO) onAnnounce?.(`Date preview: ${iso}`);
    setPreviewISO(iso);
    previewISORef.current = iso;
  }

  function handleMouseUp() {
    endDrag();
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
  const veryDense = count > 80;
  const hoverEnabled = count <= 60;
  const densityScale = veryDense ? 0.85 : (dense ? 0.92 : 1);

  // Adaptive ticks/labels based on viewRange; keep ≤12 primary labels
  type Unit = 'day' | 'week' | 'month' | 'year' | 'decade' | 'century';
  const tickData = useMemo(() => {
    const desiredMax = 12;
    const rangeDays = viewRange / dayMs;
    let unit: Unit = 'day';
    if (rangeDays > 365 * 80) unit = 'century';
    else if (rangeDays > 365 * 15) unit = 'decade';
    else if (rangeDays > 365 * 2) unit = 'year';
    else if (rangeDays > 90) unit = 'month';
    else if (rangeDays > 20) unit = 'week';
    else unit = 'day';

    function align(t: number, unit: Unit) {
      const d = new Date(t);
      if (unit === 'day') { d.setHours(0,0,0,0); return d.getTime(); }
      if (unit === 'week') { const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); d.setHours(0,0,0,0); return d.getTime(); }
      if (unit === 'month') { d.setDate(1); d.setHours(0,0,0,0); return d.getTime(); }
      if (unit === 'year') { d.setMonth(0,1); d.setHours(0,0,0,0); return d.getTime(); }
      if (unit === 'decade') { const y = d.getFullYear(); d.setFullYear(Math.floor(y/10)*10,0,1); d.setHours(0,0,0,0); return d.getTime(); }
      if (unit === 'century') { const y = d.getFullYear(); d.setFullYear(Math.floor(y/100)*100,0,1); d.setHours(0,0,0,0); return d.getTime(); }
      return t;
    }
    function add(t: number, unit: Unit, n: number) {
      const d = new Date(t);
      if (unit === 'day') { d.setDate(d.getDate() + n); }
      else if (unit === 'week') { d.setDate(d.getDate() + 7*n); }
      else if (unit === 'month') { d.setMonth(d.getMonth() + n); }
      else if (unit === 'year') { d.setFullYear(d.getFullYear() + n); }
      else if (unit === 'decade') { d.setFullYear(d.getFullYear() + 10*n); }
      else if (unit === 'century') { d.setFullYear(d.getFullYear() + 100*n); }
      return d.getTime();
    }
    function label(t: number, unit: Unit) {
      const d = new Date(t);
      if (unit === 'day') return d.toISOString().slice(0,10);
      if (unit === 'week') return `W${Math.ceil(((+new Date(Date.UTC(d.getUTCFullYear(),0,1)))-0)/dayMs/7 + (d.getUTCDay()?d.getUTCDay():7)/7)}`; // simple week id
      if (unit === 'month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (unit === 'year') return `${d.getFullYear()}`;
      if (unit === 'decade') return `${Math.floor(d.getFullYear()/10)*10}s`;
      if (unit === 'century') return `${Math.floor(d.getFullYear()/100)+1}C`;
      return d.toISOString().slice(0,10);
    }

    const start = align(viewMin, unit);
    const items: { x: number; label: string }[] = [];
    let t = start;
    while (t <= viewMax) {
      const x = tToXPercent(t);
      if (x >= 2 && x <= 98) items.push({ x, label: label(t, unit) });
      t = add(t, unit, 1);
      if (items.length > desiredMax + 4) break; // guard
    }
    return items.slice(0, desiredMax);
  }, [viewMin, viewMax, viewRange]);

  // Ticks bounded within margins [2..98]
  const tickStart = 2;
  const tickEnd = 98;

  // Compute t/x for events (respect preview during drag)
  const displayPositions = sorted.map((ev) => {
    const baseT = new Date(ev.date).getTime();
    const t = ev.id === draggingId && previewISO ? new Date(previewISO).getTime() : baseT;
    const x = tToXPercent(t);
    return { id: ev.id, t, x };
  });
  const firstX = displayPositions.length ? Math.max(tickStart, Math.min(tickEnd, Math.min(...displayPositions.map((p) => p.x)))) : tickStart;
  const lastX = displayPositions.length ? Math.max(tickStart, Math.min(tickEnd, Math.max(...displayPositions.map((p) => p.x)))) : tickEnd;

  // Simple vertical lane distribution for clusters
  const laneCount = veryDense ? 4 : (dense ? 3 : 1);
  const threshold = 2.2; // x distance threshold (viewBox units)
  let lastXForCluster = -Infinity;
  let laneIdx = 0;
  const laneShiftById = new Map<string, number>();
  [...displayPositions].sort((a, b) => a.x - b.x).forEach((p) => {
    if (p.x - lastXForCluster < threshold) {
      laneIdx = (laneIdx + 1) % laneCount;
    } else {
      laneIdx = 0;
      lastXForCluster = p.x;
    }
    const shift = laneIdx * 1.1; // spacing between lanes
    laneShiftById.set(p.id, shift);
  });

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
          const target = e.target as Element | null;
          const id = target && (target as HTMLElement).getAttribute?.('data-event-id');
          if (id) {
            // Initialize drag preview from current event date
            const ev = events.find((x) => x.id === id);
            if (ev) {
              setDraggingId(id);
              setPreviewISO(ev.date);
              draggingIdRef.current = id;
              previewISORef.current = ev.date;
              try { document.body?.setAttribute('data-dragging', '1'); } catch {}
              onDragState?.(true);
              setOverlayPE(true);
            }
          }
        }}
        onMouseDownCapture={(e) => {
          const target = e.target as Element | null;
          const id = target && (target as HTMLElement).getAttribute?.('data-event-id');
          if (id) {
            const ev = events.find((x) => x.id === id);
            if (ev) {
              setDraggingId(id);
              setPreviewISO(ev.date);
              draggingIdRef.current = id;
              previewISORef.current = ev.date;
              try { document.body?.setAttribute('data-dragging', '1'); } catch {}
              onDragState?.(true);
              setOverlayPE(true);
            }
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { endDrag(); setHoveredId(null); setCreateHint((prev) => ({ ...prev, visible: false })); }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => endDrag()}
        onPointerLeave={() => { endDrag(); setHoveredId(null); setCreateHint((prev) => ({ ...prev, visible: false })); }}
        onWheel={handleWheel}
      >
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b5b74" />
            <stop offset="50%" stopColor="#5f7f99" />
            <stop offset="100%" stopColor="#3b5b74" />
          </linearGradient>
          <filter id="cardShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.3" stdDeviation="0.5" floodColor="#0a0f14" floodOpacity="0.6" />
          </filter>
          <filter id="selGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="connectorShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.2" stdDeviation="0.3" floodColor="#0a0f14" floodOpacity="0.5" />
          </filter>
          {/* chevron marker removed in favor of square endpoint */}
        </defs>
        {/* ticks & labels within margins */}
        {tickData.map((t, idx) => (
          <g key={idx}>
            <line x1={t.x} y1={9.55} x2={t.x} y2={10.45} stroke="#e5e7eb" strokeWidth={0.2} data-testid="axis-tick" />
            <text x={t.x} y={11.7} textAnchor="middle" fontSize={0.8} fill="#94a3b8" style={{ fontFamily: 'Share Tech Mono, ui-monospace' }} data-testid="axis-label">{t.label}</text>
          </g>
        ))}
        {/* main track with margins */}
        <line x1={tickStart} y1="10" x2={tickEnd} y2="10" stroke="url(#timelineGradient)" strokeWidth="2" strokeLinecap="round" shapeRendering="geometricPrecision" />

        {/* range bar spanning first..last events with start/end markers */}
        {displayPositions.length > 0 && (
          <g>
            {/* Use a rect so the element has non-zero bounding box for visibility checks */}
            <rect x={firstX} y={9.6} width={Math.max(0.001, lastX - firstX)} height={0.8} fill="#0ea5e9" opacity={0.5} data-testid="range-bar" />
            {/* Start marker */}
            <path d={`M ${firstX} 9.2 L ${firstX - 0.8} 10 L ${firstX} 10.8 Z`} fill="#0ea5e9" opacity={0.8} data-testid="range-start" />
            {/* End marker */}
            <path d={`M ${lastX} 9.2 L ${lastX + 0.8} 10 L ${lastX} 10.8 Z`} fill="#0ea5e9" opacity={0.8} data-testid="range-end" />
          </g>
        )}

        {/* edge labels */}
        <text x={tickStart} y={19.3} textAnchor="start" fontSize={1.2} fill="#64748b" style={{ fontFamily: 'Share Tech Mono, ui-monospace' }}>
          {new Date(viewMin).toISOString().slice(0, 10)}
        </text>
        <text x={tickEnd} y={19.3} textAnchor="end" fontSize={1.2} fill="#64748b" style={{ fontFamily: 'Share Tech Mono, ui-monospace' }}>
          {new Date(viewMax).toISOString().slice(0, 10)}
        </text>
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
                setHoveredId(null);
                setDraggingId(id);
                setPreviewISO(ev.date);
                draggingIdRef.current = id;
                previewISORef.current = ev.date;
                try { document.body?.setAttribute('data-dragging', '1'); } catch {}
                onDragState?.(true);
              }}
              onStartInlineEdit={(id) => { setHoveredId(null); setEditingId(id); }}
              onSaveInlineEdit={(id, updates) => { setEditingId(null); onInlineEdit?.(id, updates); }}
              onCancelInlineEdit={() => setEditingId(null)}
              onHoverChange={(hovered) => setHoveredId(hovered ? ev.id : (hoveredId === ev.id ? null : hoveredId))}
              onNudge={(id, deltaDays) => {
                const base = new Date(ev.date).getTime();
                const t = base + deltaDays * dayMs;
                const iso = new Date(t).toISOString().slice(0,10);
                setPreviewISO(iso);
                setDraggingId(id);
                onAnnounce?.(`Date changed to ${iso}`);
                onDragDate?.(id, iso);
                setTimeout(() => { setDraggingId(null); setPreviewISO(null); }, 0);
              }}
            />
          );
        })}

        {/* Create-on-track floating + icon */}
        {onCreateAt && createHint.visible && (
          <g transform={`translate(${createHint.x}, 10)`} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onCreateAt(createHint.iso); }} role="button" aria-label={`Create at ${createHint.iso}`} data-testid="create-plus">
            <circle cx={0} cy={0} r={1.0} fill="#ffffff" stroke="#334155" strokeWidth={0.2} />
            <line x1={-0.6} y1={0} x2={0.6} y2={0} stroke="#334155" strokeWidth={0.2} />
            <line x1={0} y1={-0.6} x2={0} y2={0.6} stroke="#334155" strokeWidth={0.2} />
          </g>
        )}
      </svg>
    </div>
  );
};

export default Timeline;
