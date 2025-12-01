import React, { useState, useCallback, useMemo } from 'react';
import type { Tick as AxisTick, TickScaleKind } from '../timeline/hooks/useAxisTicks';

type VisualTickType = TickScaleKind | 'minute' | 'quarter' | 'season';

interface Tick {
  t: number;
  label: string;
  x: number;
  level: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  type: VisualTickType;
}

interface TimelineRange {
  minDate: number;
  maxDate: number;
  dateRange: number;
  isZoomed: boolean;
}

interface EnhancedTimelineAxisProps {
  timelineRange: TimelineRange;
  viewportSize: { width: number; height: number };
  timelineY: number;
  baseTicks: AxisTick[];
  onDateHover?: (date: Date | null) => void;
  onTimelineClick?: (date: Date) => void;
}

export const EnhancedTimelineAxis: React.FC<EnhancedTimelineAxisProps> = ({
  timelineRange,
  viewportSize,
  timelineY,
  baseTicks,
  onDateHover,
  onTimelineClick
}) => {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const axisSpanDays = timelineRange.dateRange / (24 * 60 * 60 * 1000);

  // Generate enhanced ticks with multiple levels
  const enhancedTicks = useMemo(() => {
    const ticks: Tick[] = [];
    const { minDate, maxDate, dateRange } = timelineRange;
    const spanDays = dateRange / (24 * 60 * 60 * 1000);
    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px total
    const rightMargin = 40;
    const usableWidth = Math.max(1, viewportSize.width - leftMargin - rightMargin);
    const projectX = (timestamp: number) => leftMargin + ((timestamp - minDate) / dateRange) * usableWidth;
    const baseScaleSet = new Set<TickScaleKind>(baseTicks.map(tick => tick.scale));
    const baseHasMonthScale = baseScaleSet.has('month');
    const baseHasDayScale = baseScaleSet.has('day');
    const baseHasHourScale = baseScaleSet.has('hour');
    const monthAsPrimary = baseScaleSet.size === 1 && baseHasMonthScale;

    // Primary ticks (years) - always shown
    baseTicks.forEach(tick => {
      const level: Tick['level'] = tick.scale === 'month' && !monthAsPrimary ? 'secondary' : 'primary';
      ticks.push({
        t: tick.t,
        label: tick.label,
        x: tick.x,
        level,
        type: tick.scale
      });
    });

    // Secondary ticks (months) - shown when zoomed to < 12 years
    if (spanDays < 365 * 12 && !baseHasMonthScale) {
      const approxMonths = Math.max(1, Math.floor(spanDays / 30));
      const monthStep = Math.max(1, Math.ceil(approxMonths / 16));
      const startDate = new Date(minDate);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      for (let date = new Date(startDate); date.getTime() <= maxDate; ) {
        const timestamp = date.getTime();
        if (timestamp >= minDate && timestamp <= maxDate) {
          const x = projectX(timestamp);
          const labelOptions: Intl.DateTimeFormatOptions = spanDays > 365 ? { month: 'short', year: '2-digit' } : { month: 'short' };
          const label = date.toLocaleDateString('en-US', labelOptions);

          // Don't add if too close to existing primary tick
          const tooClose = ticks.some(existing =>
            existing.level === 'primary' && Math.abs(existing.x - x) < 40
          );

          if (!tooClose) {
            ticks.push({
              t: timestamp,
              label,
              x,
              level: 'secondary',
              type: 'month'
            });
          }
        }

        date.setMonth(date.getMonth() + monthStep);
      }
    }

    // Tertiary ticks (days) - shown when zoomed to < 3 months
  if (!baseHasDayScale && spanDays < 90 && spanDays > 0) {
      const dayStep = Math.max(1, Math.floor(spanDays / 20)); // Max ~20 day labels
      const startDate = new Date(minDate);
      startDate.setHours(0, 0, 0, 0);

      for (let date = new Date(startDate); date.getTime() <= maxDate; ) {
        const timestamp = date.getTime();
        if (timestamp >= minDate && timestamp <= maxDate) {
          const x = projectX(timestamp);
          const includeWeekday = spanDays <= 14;
          const includeMonth = spanDays <= 45;
          const label = date.toLocaleDateString('en-US', {
            weekday: includeWeekday ? 'short' : undefined,
            month: includeMonth ? 'short' : undefined,
            day: 'numeric'
          }).replace(',', '');

          const dayLabelLevel: Tick['level'] = includeWeekday ? 'secondary' : 'tertiary';

          // Don't add if too close to existing ticks
          const tooClose = ticks.some(existing => {
            if (existing.type === 'hour' || existing.type === 'minute') {
              return false;
            }
            if (existing.type === 'day' && dayLabelLevel === existing.level) {
              return Math.abs(existing.x - x) < 24;
            }
            return Math.abs(existing.x - x) < 30;
          });

          if (!tooClose) {
            ticks.push({
              t: timestamp,
              label,
              x,
              level: dayLabelLevel,
              type: 'day'
            });
          }
        }

        date.setDate(date.getDate() + dayStep);
      }
    }

    // Quaternary ticks (hours) - shown when zoomed to < 1 day
  if (!baseHasHourScale && spanDays < 1) {
      const spanHours = spanDays * 24;
      const hourStep = spanHours < 6 ? 1 : spanHours < 12 ? 2 : spanHours < 24 ? 6 : 12;
      const startDate = new Date(minDate);
      startDate.setMinutes(0, 0, 0);

      for (let date = new Date(startDate); date.getTime() <= maxDate; ) {
        const timestamp = date.getTime();
        if (timestamp >= minDate && timestamp <= maxDate) {
          const x = projectX(timestamp);
          const label = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
          });

          // Don't add if too close to existing ticks
          const tooClose = ticks.some(existing => Math.abs(existing.x - x) < 25);

          if (!tooClose) {
            ticks.push({
              t: timestamp,
              label,
              x,
              level: 'quaternary',
              type: 'hour'
            });
          }
        }

        date.setHours(date.getHours() + hourStep);
      }
    }

    // Minute ticks - shown when zoomed to < 2 hours
  if (spanDays < (2 / 24)) {
      const spanMinutes = spanDays * 24 * 60;
      const minuteStep = spanMinutes < 30 ? 5 : spanMinutes < 60 ? 10 : spanMinutes < 120 ? 15 : 30;
      const startDate = new Date(minDate);
      startDate.setSeconds(0, 0);
      // Round to nearest minute step
      const startMinutes = Math.floor(startDate.getMinutes() / minuteStep) * minuteStep;
      startDate.setMinutes(startMinutes);

      for (let date = new Date(startDate); date.getTime() <= maxDate; ) {
        const timestamp = date.getTime();
        if (timestamp >= minDate && timestamp <= maxDate) {
          const x = projectX(timestamp);
          const label = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          // Don't add if too close to existing ticks
          const tooClose = ticks.some(existing => Math.abs(existing.x - x) < 40);

          if (!tooClose) {
            ticks.push({
              t: timestamp,
              label,
              x,
              level: 'quaternary',
              type: 'minute'
            });
          }
        }

        date.setMinutes(date.getMinutes() + minuteStep);
      }
    }

    return ticks.sort((a, b) => a.x - b.x);
  }, [timelineRange, viewportSize.width, baseTicks]);

  // Generate season/quarter backgrounds
  const seasonBackgrounds = useMemo(() => {
    const { minDate, maxDate, dateRange } = timelineRange;
    const spanDays = dateRange / (24 * 60 * 60 * 1000);

    // Only show seasons if span is reasonable (less than 10 years)
    if (spanDays > 365 * 10) return [];

    const backgrounds: Array<{ x: number; width: number; color: string; label: string }> = [];
    const startYear = new Date(minDate).getFullYear();
    const endYear = new Date(maxDate).getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const seasons = [
        { name: 'Spring', start: new Date(year, 2, 20), end: new Date(year, 5, 20), color: '#e8f5e8' },
        { name: 'Summer', start: new Date(year, 5, 20), end: new Date(year, 8, 22), color: '#fff7e6' },
        { name: 'Autumn', start: new Date(year, 8, 22), end: new Date(year, 11, 21), color: '#fdf2e9' },
        { name: 'Winter', start: new Date(year, 11, 21), end: new Date(year + 1, 2, 20), color: '#f0f8ff' }
      ];

      seasons.forEach(season => {
        const startTime = Math.max(season.start.getTime(), minDate);
        const endTime = Math.min(season.end.getTime(), maxDate);

        if (startTime < endTime) {
          const x = ((startTime - minDate) / dateRange) * viewportSize.width;
          const width = ((endTime - startTime) / dateRange) * viewportSize.width;

          backgrounds.push({
            x,
            width,
            color: season.color,
            label: season.name
          });
        }
      });
    }

    return backgrounds;
  }, [timelineRange, viewportSize.width]);

  // Handle mouse interactions
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);

    if (onDateHover) {
      // Use the same margined coordinate system as cards/anchors
      const navRailWidth = 56;
      const additionalMargin = 80;
      const leftMargin = navRailWidth + additionalMargin; // 136px total
      const rightMargin = 40;
      const usableWidth = viewportSize.width - leftMargin - rightMargin;

      // Calculate ratio within the usable content area
      const adjustedX = Math.max(0, x - leftMargin);
      const ratio = Math.min(1, Math.max(0, adjustedX / usableWidth));
      const timestamp = timelineRange.minDate + (ratio * timelineRange.dateRange);
      onDateHover(new Date(timestamp));
    }
  }, [timelineRange, viewportSize.width, onDateHover]);

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
    if (onDateHover) onDateHover(null);
  }, [onDateHover]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onTimelineClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // Use the same margined coordinate system as hover date calculation
      const navRailWidth = 56;
      const additionalMargin = 80;
      const leftMargin = navRailWidth + additionalMargin; // 136px total
      const rightMargin = 40;
      const usableWidth = viewportSize.width - leftMargin - rightMargin;

      // Calculate ratio within the usable content area
      const adjustedX = Math.max(0, x - leftMargin);
      const ratio = Math.min(1, Math.max(0, adjustedX / usableWidth));
      const timestamp = timelineRange.minDate + (ratio * timelineRange.dateRange);
      onTimelineClick(new Date(timestamp));
    }
  }, [timelineRange, viewportSize.width, onTimelineClick]);

  // Get date at hover position
  const hoverDate = useMemo(() => {
    if (hoverX === null) return null;

    // Use the same margined coordinate system as cards/anchors
    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px total
    const rightMargin = 40;
    const usableWidth = viewportSize.width - leftMargin - rightMargin;

    // Calculate ratio within the usable content area
    const adjustedX = Math.max(0, hoverX - leftMargin);
    const ratio = Math.min(1, Math.max(0, adjustedX / usableWidth));
    const timestamp = timelineRange.minDate + (ratio * timelineRange.dateRange);
    return new Date(timestamp);
  }, [hoverX, timelineRange, viewportSize.width]);

  return (
    <div
      className="absolute"
      style={{
        left: 0,
        top: timelineY - 40,
        width: viewportSize.width,
        height: 80,
        cursor: onTimelineClick ? 'crosshair' : 'default'
      }}
      data-testid="enhanced-timeline-axis"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <svg
        width={viewportSize.width}
        height={80}
        viewBox={`0 0 ${viewportSize.width} 80`}
        style={{ overflow: 'visible' }}
      >
        {/* Season/Quarter backgrounds */}
        {seasonBackgrounds.map((bg, index) => (
          <rect
            key={`season-${index}`}
            x={bg.x}
            y={20}
            width={bg.width}
            height={40}
            fill={bg.color}
            opacity={0.3}
            rx={2}
          />
        ))}

        {/* Main timeline bar */}
        <rect
          x={0}
          y={37}
          width={viewportSize.width}
          height={6}
          fill="var(--page-text-primary)"
          data-testid="timeline-axis"
          rx={3}
        />

        {/* Tick marks and labels */}
        {enhancedTicks.map((tick, index) => {
          const isPrimary = tick.level === 'primary';
          const isSecondary = tick.level === 'secondary';
          const isDayLabel = tick.type === 'day';
          const isHourLabel = tick.type === 'hour';
          const isMinuteLabel = tick.type === 'minute';

          const tickHeight = isPrimary ? 20 : isSecondary ? 15 : 10;
          const tickY = 40 - tickHeight / 2;
          let labelY: number;
          if (isHourLabel || isMinuteLabel) {
            labelY = 70;
          } else if (isDayLabel && axisSpanDays <= 14) {
            labelY = 18;
          } else if (isPrimary) {
            labelY = 15;
          } else if (isSecondary) {
            labelY = 65;
          } else {
            labelY = 70;
          }

          const fontSize = isPrimary ? 14 : isSecondary ? 12 : 10;
          const fontWeight = isPrimary ? 'bold' : isSecondary ? '600' : 'normal';
          const tickStrokeColor = 'var(--page-text-primary)';
          const labelColor = isPrimary ? 'var(--page-text-primary)' : 'var(--page-text-secondary)';

          return (
            <g
              key={`enhanced-tick-${index}`}
              data-testid="timeline-axis-tick"
              data-tick-level={tick.level}
              data-tick-type={tick.type}
            >
              {/* Tick mark */}
              <line
                x1={tick.x}
                x2={tick.x}
                y1={tickY}
                y2={tickY + tickHeight}
                stroke={tickStrokeColor}
                strokeWidth={isPrimary ? 2 : 1.5}
                opacity={1}
              />

              {/* Label */}
              <text
                data-testid="axis-label"
                x={tick.x}
                y={labelY}
                fontSize={fontSize}
                fill={labelColor}
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={fontWeight}
                opacity={1}
              >
                {tick.label}
              </text>
            </g>
          );
        })}

        {/* Hover indicator */}
        {hoverX !== null && (
          <g>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={25}
              y2={55}
              stroke="#3b82f6"
              strokeWidth={1}
              opacity={0.7}
              strokeDasharray="2,2"
            />
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {hoverDate && hoverX !== null && (
        <div
          className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50"
          style={{
            left: Math.min(hoverX, viewportSize.width - 120),
            top: -10,
            transform: 'translateX(-50%)'
          }}
        >
          {(() => {
            const spanDays = timelineRange.dateRange / (24 * 60 * 60 * 1000);
            const showTime = spanDays < 1; // Show time when zoomed to less than 1 day

            if (showTime) {
              return hoverDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            } else {
              return hoverDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
          })()}
        </div>
      )}
    </div>
  );
};