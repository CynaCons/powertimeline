import React, { useEffect, useRef, useState } from 'react';
import { wrapMonoClamp, wrapBodyClamp } from '../../lib/text';

interface NodeProps {
  id: string;
  x: number;
  date: string;
  displayDate: string;
  title: string;
  description?: string;
  above: boolean;
  laneShift: number;
  laneIndex?: number;
  scale: number;
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
}

// Memoized node/card to avoid re-rendering unchanged nodes
export const Node = React.memo(function Node({
  id,
  x,
  date,
  displayDate,
  title,
  description,
  above,
  laneShift,
  laneIndex = 0,
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
}: NodeProps) {
  const baseLabelY = above ? 6.0 : 14.0;
  const labelY = above ? Math.max(4.5, baseLabelY - laneShift) : Math.min(15.5, baseLabelY + laneShift);
  const anchorSize = 1.0;
  const anchorY = 10 - anchorSize / 2;
  const stemStartY = above ? 10 - anchorSize / 2 : 10 + anchorSize / 2;
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

  const [etitle, setETitle] = useState(title);
  const [edesc, setEDesc] = useState(description ?? '');
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { if (isEditing) { setETitle(title); setEDesc(description ?? ''); } }, [isEditing, title, description]);
  useEffect(() => { if (isEditing && titleInputRef.current) { titleInputRef.current.focus(); titleInputRef.current.select?.(); } }, [isEditing]);

  const anchorYForPath = above ? cardY + cardH : cardY;
  const endXRaw = Math.max(cardX + pad, Math.min(cardX + cardW - pad, x));
  const endX = Math.abs(endXRaw - x) < 0.05 ? endXRaw + 0.05 : endXRaw;
  const connectorPath = `M ${x} ${stemStartY} L ${endX} ${anchorYForPath}`;
  const connectorColor = '#74c7ec';
  const connectorOpacity = Math.max(opacity, 0.92);

  // Remove single-line truncate locals (multi-line wrapper now used)
  // const titleSize ... existing declarations remain
  const titleSize = 1.2 * Math.max(0.9, scale);
  const bodySize = 1.0 * Math.max(0.9, scale);
  // Precompute wrapped title for reuse in description tooltip logic
  const wrappedTitle = wrapMonoClamp(title, cardW, titleSize, pad, 2);
  const titleLines = wrappedTitle.lines;
  const titleTrunc = wrappedTitle.truncated;
  const clipId = `clip-${id}`;

  const [focused, setFocused] = useState(false);

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Event: ${date} — ${title}`}
      data-lane-index={laneIndex}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => { onSelect?.(id); onHoverChange?.(false); }}
      onDoubleClick={() => { onSelect?.(id); onStartInlineEdit?.(id); onHoverChange?.(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
            if (isEditing) onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined });
            else { onSelect?.(id); onStartInlineEdit?.(id); }
            onHoverChange?.(false);
        } else if (e.key === ' ') {
          e.preventDefault(); onSelect?.(id);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          if (!draggable) return; e.preventDefault();
          const delta = (e.shiftKey ? 7 : 1) * (e.key === 'ArrowLeft' ? -1 : 1);
          onNudge?.(id, delta);
        }
      }}
      onPointerDown={(e) => { if (!draggable || isEditing) return; try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}; onStartDrag?.(id); onHoverChange?.(false); }}
      onMouseDown={() => { if (!draggable || isEditing) return; onStartDrag?.(id); onHoverChange?.(false); }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      style={{ cursor: draggable ? 'pointer' : 'default' }}
    >
      {/* Enlarged invisible hit area around anchor for easier pointer targeting */}
      <rect
        x={Math.max(0, x - 1.5)}
        y={anchorY - 1.5}
        width={3}
        height={anchorSize + 3}
        fill="transparent"
        pointerEvents="all"
        onPointerDown={(e) => { if (!draggable || isEditing) return; try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}; onStartDrag?.(id); onHoverChange?.(false); }}
        onMouseDown={() => { if (!draggable || isEditing) return; onStartDrag?.(id); onHoverChange?.(false); }}
        onClick={() => { onSelect?.(id); onHoverChange?.(false); }}
      />
      <title>{`${date} — ${title}`}</title>
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
            style={{ cursor: draggable ? 'grab' : 'default', filter: isSelected ? 'url(#selGlow)' : undefined, pointerEvents: 'all', fillOpacity: isSelected ? 1 : Math.max(0.85, opacity) }}
            onPointerDown={(e) => { if (!draggable) return; try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}; onStartDrag?.(id); onHoverChange?.(false); }}
            onMouseDown={() => { if (!draggable) return; onStartDrag?.(id); onHoverChange?.(false); }}
            onClick={() => { onSelect?.(id); onHoverChange?.(false); }}
            onDoubleClick={() => { onSelect?.(id); onStartInlineEdit?.(id); onHoverChange?.(false); }}
          />
        );
      })()}
      <text x={x} y={above ? 8.1 : 12.1} textAnchor="middle" fontSize={0.85} fill="#64748b" data-testid="anchor-date" style={{ fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}>{displayDate}</text>
      <g opacity={connectorOpacity}>
        <path d={connectorPath} stroke={connectorColor} strokeWidth={0.35} fill="none" shapeRendering="geometricPrecision" />
        <rect x={endX - 0.35} y={anchorYForPath - 0.35} width={0.7} height={0.7} fill={connectorColor} stroke="#0e1624" strokeWidth={0.1} />
      </g>
      {showLabel && (
        <g opacity={opacity}>
          <defs>
            <clipPath id={clipId}><rect x={cardX} y={cardY} width={cardW} height={cardH} rx={0} /></clipPath>
          </defs>
          <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={0} fill="#0b1220" stroke="#3a4b5f" strokeWidth={0.2} filter="url(#cardShadow)" />
          <line x1={cardX} y1={cardY + pad + titleSize + 0.5} x2={cardX + cardW} y2={cardY + pad + titleSize + 0.5} stroke="#1f2b3a" strokeWidth={0.15} />
          {(() => {
            return (
              <g>
                {titleLines.map((ln, i) => (
                  <text key={i} x={cardX + pad} y={cardY + pad + titleSize + i * (titleSize + 0.2)} fontSize={titleSize} fill="#e5eef9" style={{ fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: 0.2 }}>{ln}</text>
                ))}
                {titleTrunc && !isEditing && (
                  <title>{title}</title>
                )}
              </g>
            );
          })()}
          {description && !isEditing && (() => {
            const maxBodyLines = isExpanded ? 6 : 3;
            const { lines: bodyLines, truncated: bodyTrunc } = wrapBodyClamp(description, cardW, bodySize, pad, maxBodyLines);
            return (
              <g clipPath={`url(#${clipId})`}>
                {bodyLines.map((ln, i) => (
                  <text key={i} x={cardX + pad} y={cardY + pad + titleSize + 1.8 + i * (bodySize + 0.6)} fontSize={bodySize} fill="#acbdce" data-testid="card-description" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>{ln}</text>
                ))}
                {(bodyTrunc || titleTrunc) && <title>{`${date} — ${title}${description ? '\n' + description : ''}`}</title>}
              </g>
            );
          })()}
          {isSelected && isEditing && (
            <foreignObject x={cardX} y={cardY} width={cardW} height={cardH} requiredExtensions="http://www.w3.org/1999/xhtml">
              <div style={{ fontSize: 12, fontFamily: 'ui-sans-serif, system-ui', padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancelInlineEdit?.(); } if (e.key === 'Enter') { e.stopPropagation(); onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); } }} onBlur={(e) => { const current = e.currentTarget as HTMLElement; setTimeout(() => { if (!current.contains(document.activeElement)) { onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); } }, 0); }}>
                <input ref={titleInputRef} aria-label="Inline Title" type="text" value={etitle} onChange={(e) => setETitle((e.target as HTMLInputElement).value)} style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4 }} />
                <input aria-label="Inline Description" type="text" placeholder="Optional" value={edesc} onChange={(e) => setEDesc((e.target as HTMLInputElement).value)} style={{ padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); }} style={{ background: '#059669', color: 'white', padding: '4px 8px', borderRadius: 4 }}>Save</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onCancelInlineEdit?.(); }} style={{ background: '#e5e7eb', color: '#111827', padding: '4px 8px', borderRadius: 4 }}>Cancel</button>
                </div>
              </div>
            </foreignObject>
          )}
          {/* Focus-visible outline (when keyboard focusing) */}
          {focused && !isSelected && (
        <rect x={Math.max(0, x - 2)} y={Math.min(anchorY - 2, 20)} width={4} height={anchorSize + 4} fill="none" stroke="var(--cc-color-focus-accent, #74c7ec)" strokeWidth={0.4} pointerEvents="none" />
      )}
        </g>
      )}
    </g>
  );
});
