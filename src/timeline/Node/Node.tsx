import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  isHover: boolean; // new
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
  // Optional rich content injection (Phase C: component injection support)
  renderContent?: (ctx: { id: string; title: string; description?: string; isExpanded: boolean; isSelected: boolean; isEditing: boolean }) => React.ReactNode;
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
  isHover,
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
  renderContent,
}: NodeProps) {
  const baseLabelY = above ? 6.0 : 14.0;
  const labelY = above ? Math.max(4.0, baseLabelY - laneShift) : Math.min(16.0, baseLabelY + laneShift);
  const anchorSize = 0.6; // small light grey squares
  const anchorY = 10 - anchorSize / 2;
  const stemStartY = above ? 10 - anchorSize / 2 : 10 + anchorSize / 2;
  const pad = 0.6 * Math.max(0.9, scale);
  const titleSize = 1.2 * Math.max(0.9, scale);
  const bodySize = 1.0 * Math.max(0.9, scale);
  const lineGapTitle = 0.2 * Math.max(0.9, scale);
  const lineGapBody = 0.55 * Math.max(0.9, scale);
  const dividerGap = 0.35; // space below divider

  // Phase C: dynamic truncation logic (1–2 title lines, 1 body line when not expanded)
  const maxTitleLines = 2; // always clamp at 2
  const maxBodyLines = isExpanded ? 6 : 1;

  // Width logic: wider when expanded
  const collapsedW = 16 * scale;
  const expandedW = 26 * Math.max(0.9, scale);
  const cardW = isExpanded ? expandedW : collapsedW;

  // Wrap text (still using util for approximate mono/body) – used only for height + hidden text fallback
  const wrappedTitle = useMemo(() => wrapMonoClamp(title, cardW, titleSize, pad, maxTitleLines), [title, cardW, titleSize, pad]);
  const wrappedBody = useMemo(() => description ? wrapBodyClamp(description, cardW, bodySize, pad, maxBodyLines) : { lines: [] as string[], truncated: false }, [description, cardW, bodySize, pad, maxBodyLines]);

  // Compute dynamic height
  const titleBlockH = wrappedTitle.lines.length * titleSize + (wrappedTitle.lines.length - 1) * lineGapTitle;
  const bodyBlockH = wrappedBody.lines.length > 0 ? (dividerGap + wrappedBody.lines.length * bodySize + (wrappedBody.lines.length - 1) * lineGapBody) : 0;
  const cardH = pad + titleBlockH + bodyBlockH + pad;

  const cardX = Math.max(2, Math.min(98 - cardW, x - cardW / 2));
  const cardBottomY = labelY;
  const rawCardY = above ? cardBottomY - cardH : cardBottomY;
  const cardY = Math.max(1, Math.min(19 - cardH, rawCardY));

  // Connector path recomputed with dynamic height
  const anchorYForPath = above ? cardY + cardH : cardY;
  const connectorPadX = pad;
  const endXRaw = Math.max(cardX + connectorPadX, Math.min(cardX + cardW - connectorPadX, x));
  const endX = Math.abs(endXRaw - x) < 0.05 ? endXRaw + 0.05 : endXRaw;
  const connectorPath = `M ${x} ${stemStartY} L ${endX} ${anchorYForPath}`;
  const connectorColor = 'var(--cc-color-connector)';
  const connectorOpacity = Math.max(opacity, 0.9);

  // Inline edit state
  const [etitle, setETitle] = useState(title);
  const [edesc, setEDesc] = useState(description ?? '');
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { if (isEditing) { setETitle(title); setEDesc(description ?? ''); } }, [isEditing, title, description]);
  useEffect(() => { if (isEditing && titleInputRef.current) { titleInputRef.current.focus(); titleInputRef.current.select?.(); } }, [isEditing]);

  const [focused, setFocused] = useState(false);
  const clipId = `clip-${id}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Event: ${date} — ${title}${isEditing ? ' (editing, press Enter to save or Escape to cancel)' : ''}`}
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
        } else if (e.key === 'PageUp' || e.key === 'PageDown') {
          if (!draggable) return; e.preventDefault();
          const delta = (e.shiftKey ? 30 : 7) * (e.key === 'PageUp' ? -1 : 1);
          onNudge?.(id, delta);
        }
      }}
      onPointerDown={(e) => { if (!draggable || isEditing) return; try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}; onStartDrag?.(id); onHoverChange?.(false); }}
      onMouseDown={() => { if (!draggable || isEditing) return; onStartDrag?.(id); onHoverChange?.(false); }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      style={{ cursor: draggable ? 'pointer' : 'default' }}
    >
      {/* Invisible hit area around anchor */}
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
        const anchorFillBase = isSelected ? 'var(--cc-color-anchor-selected)' : (isHover ? 'var(--cc-color-anchor-hover)' : 'var(--cc-color-anchor-fill)');
        return (
          <rect
            x={rectX}
            y={anchorY}
            width={anchorSize}
            height={anchorSize}
            fill={anchorFillBase}
            stroke="var(--cc-color-anchor-outline)"
            strokeWidth={0.15}
            rx={1}
            data-event-id={id}
            data-title={title}
            style={{ cursor: draggable ? 'grab' : 'default', filter: isSelected ? 'drop-shadow(0 0 2px var(--cc-color-selection-glow))' : undefined, pointerEvents: 'all', transition: 'fill 120ms ease', fillOpacity: isSelected ? 1 : Math.max(0.9, opacity) }}
            onPointerDown={(e) => { if (!draggable) return; try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}; onStartDrag?.(id); onHoverChange?.(false); }}
            onMouseDown={() => { if (!draggable) return; onStartDrag?.(id); onHoverChange?.(false); }}
            onClick={() => { onSelect?.(id); onHoverChange?.(false); }}
            onDoubleClick={() => { onSelect?.(id); onStartInlineEdit?.(id); onHoverChange?.(false); }}
          />
        );
      })()}
      <text x={x} y={above ? 8.1 : 12.1} textAnchor="middle" fontSize={0.7} fill="var(--cc-color-axis-label)" data-testid="anchor-date" style={{ fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}>{displayDate}</text>
      <g opacity={connectorOpacity}>
        <path d={connectorPath} stroke={connectorColor} strokeWidth={0.25} fill="none" shapeRendering="geometricPrecision" />
        <rect x={endX - 0.3} y={anchorYForPath - 0.3} width={0.6} height={0.6} fill={connectorColor} stroke="var(--cc-color-card-bg)" strokeWidth={0.08} />
      </g>
      {showLabel && (
        <g opacity={opacity}>
          <defs>
            <clipPath id={clipId}><rect x={cardX} y={cardY} width={cardW} height={cardH} rx={0} /></clipPath>
          </defs>
          {/* Card surface */}
          <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={2} fill="var(--cc-color-card-bg)" stroke="var(--cc-color-card-border)" strokeWidth={0.15} style={{ filter: 'drop-shadow(var(--cc-shadow-card))' }} />
          {/* Minimal SVG title first line for backwards compatibility with existing tests */}
          {wrappedTitle.lines[0] && !isEditing && (
            <text x={cardX + pad} y={cardY + pad + titleSize} fontSize={titleSize} fill="var(--cc-color-card-title)" data-testid="card-title-visible" style={{ fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: 0.2 }}>
              {wrappedTitle.lines[0]}
            </text>
          )}
          {/* HTML content (foreignObject) for full multi-line + body (Phase C migration) when not editing */}
          {!isEditing && (
            <foreignObject x={cardX} y={cardY} width={cardW} height={cardH} requiredExtensions="http://www.w3.org/1999/xhtml">
              <div style={{ width: '100%', height: '100%', padding: `${pad * 5}px ${pad * 5}px`, boxSizing: 'border-box', fontFamily: 'ui-sans-serif, system-ui', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {renderContent ? (
                  renderContent({ id, title, description, isExpanded, isSelected, isEditing })
                ) : (
                  <>
                    <div style={{ fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: `${titleSize * 4}px`, lineHeight: 1.1, color: 'var(--cc-color-card-title)', marginTop: wrappedTitle.lines[0] ? -(titleSize * 4) + (titleSize * 4) : 0 }}>
                      {wrappedTitle.lines.map((ln, i) => (
                        <div key={i} style={{ display: i === 0 ? 'none' : 'block' }}>{ln}</div>
                      ))}
                    </div>
                    {wrappedBody.lines.length > 0 && (
                      <>
                        <div style={{ height: 1, background: 'var(--cc-color-card-divider)', margin: `${dividerGap * 4}px 0 ${dividerGap * 2}px` }} />
                        <div style={{ fontSize: `${bodySize * 4}px`, lineHeight: 1.25, color: 'var(--cc-color-card-body)', display: 'flex', flexDirection: 'column', gap: `${lineGapBody * 4}px` }}>
                          {wrappedBody.lines.map((ln, i) => (
                            <div key={i} data-testid={i === 0 ? 'card-description' : undefined}>{ln}</div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </foreignObject>
          )}
          {/* Inline editing UI (still foreignObject) */}
          {isSelected && isEditing && (
            <foreignObject x={cardX} y={cardY} width={cardW} height={cardH} requiredExtensions="http://www.w3.org/1999/xhtml">
              <div
                style={{ fontSize: 12, fontFamily: 'ui-sans-serif, system-ui', padding: 6, display: 'flex', flexDirection: 'column', gap: 6, height: '100%', boxSizing: 'border-box' }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancelInlineEdit?.(); } if (e.key === 'Enter') { if ((e.target as HTMLElement).tagName === 'INPUT') { e.stopPropagation(); onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); } } }}
                onBlur={(e) => { const current = e.currentTarget as HTMLElement; setTimeout(() => { if (!current.contains(document.activeElement)) { onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); } }, 0); }}
              >
                <input ref={titleInputRef} aria-label="Inline Title" type="text" value={etitle} onChange={(e) => setETitle((e.target as HTMLInputElement).value)} style={{ padding: '4px 6px', border: '1px solid var(--cc-color-input-border)', borderRadius: 4, background: 'var(--cc-color-input-bg)', color: 'var(--cc-color-card-title)' }} />
                <input aria-label="Inline Description" type="text" placeholder="Optional" value={edesc} onChange={(e) => setEDesc((e.target as HTMLInputElement).value)} style={{ padding: '4px 6px', border: '1px solid var(--cc-color-input-border)', borderRadius: 4, background: 'var(--cc-color-input-bg)', color: 'var(--cc-color-card-body)' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" aria-label="Save" onClick={(e) => { e.stopPropagation(); onSaveInlineEdit?.(id, { title: etitle, description: edesc || undefined }); }} style={{ background: 'var(--cc-color-success-bg)', color: 'var(--cc-color-success-fg)', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span role="img" aria-hidden="true">✓</span> <span>Save</span>
                  </button>
                  <button type="button" aria-label="Cancel" onClick={(e) => { e.stopPropagation(); onCancelInlineEdit?.(); }} style={{ background: 'var(--cc-color-danger-bg)', color: 'var(--cc-color-danger-fg)', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span role="img" aria-hidden="true">✕</span> <span>Cancel</span>
                  </button>
                </div>
              </div>
            </foreignObject>
          )}
          {/* Focus-visible outline */}
          {focused && !isSelected && (
            <rect x={Math.max(0, x - 2)} y={Math.min(anchorY - 2, 20)} width={4} height={anchorSize + 4} fill="none" stroke="var(--cc-color-focus-accent, #74c7ec)" strokeWidth={0.4} pointerEvents="none" />
          )}
        </g>
      )}
    </g>
  );
});
