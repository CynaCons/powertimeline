import { useMemo } from 'react';

export type TickScaleKind = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface Tick {
  t: number;
  label: string;
  x: number; // pixel coordinate within the axis
  scale: TickScaleKind;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

interface BaseScale {
  id: string;
  approxDays: number;
  format: Intl.DateTimeFormatOptions;
  minSpacingPx: number;
  minLabels?: number;
}

interface HourScale extends BaseScale {
  kind: 'hour';
  stepHours: number;
}

interface DayScale extends BaseScale {
  kind: 'day';
  stepDays: number;
}

interface WeekScale extends BaseScale {
  kind: 'week';
  stepWeeks: number;
}

interface MonthScale extends BaseScale {
  kind: 'month';
  stepMonths: number;
}

interface YearScale extends BaseScale {
  kind: 'year';
  stepYears: number;
}

type ScaleDefinition = HourScale | DayScale | WeekScale | MonthScale | YearScale;

const SCALE_DEFINITIONS: ScaleDefinition[] = [
  { id: 'hour-1', kind: 'hour', stepHours: 1, approxDays: 1 / 24, format: { month: 'short', day: 'numeric', hour: 'numeric' }, minSpacingPx: 14, minLabels: 2 },
  { id: 'hour-2', kind: 'hour', stepHours: 2, approxDays: 2 / 24, format: { month: 'short', day: 'numeric', hour: 'numeric' }, minSpacingPx: 16 },
  { id: 'hour-3', kind: 'hour', stepHours: 3, approxDays: 3 / 24, format: { month: 'short', day: 'numeric', hour: 'numeric' }, minSpacingPx: 18 },
  { id: 'hour-6', kind: 'hour', stepHours: 6, approxDays: 6 / 24, format: { month: 'short', day: 'numeric', hour: 'numeric' }, minSpacingPx: 20 },
  { id: 'hour-12', kind: 'hour', stepHours: 12, approxDays: 12 / 24, format: { month: 'short', day: 'numeric', hour: 'numeric' }, minSpacingPx: 24 },
  { id: 'day-1', kind: 'day', stepDays: 1, approxDays: 1, format: { month: 'short', day: 'numeric' }, minSpacingPx: 26 },
  { id: 'day-2', kind: 'day', stepDays: 2, approxDays: 2, format: { month: 'short', day: 'numeric' }, minSpacingPx: 28 },
  { id: 'day-3', kind: 'day', stepDays: 3, approxDays: 3, format: { month: 'short', day: 'numeric' }, minSpacingPx: 30 },
  { id: 'week-1', kind: 'week', stepWeeks: 1, approxDays: 7, format: { month: 'short', day: 'numeric' }, minSpacingPx: 34 },
  { id: 'week-2', kind: 'week', stepWeeks: 2, approxDays: 14, format: { month: 'short', day: 'numeric' }, minSpacingPx: 38 },
  { id: 'month-1', kind: 'month', stepMonths: 1, approxDays: 30, format: { month: 'short', year: '2-digit' }, minSpacingPx: 44 },
  { id: 'month-2', kind: 'month', stepMonths: 2, approxDays: 60, format: { month: 'short', year: '2-digit' }, minSpacingPx: 46 },
  { id: 'month-3', kind: 'month', stepMonths: 3, approxDays: 90, format: { month: 'short', year: 'numeric' }, minSpacingPx: 48 },
  { id: 'month-6', kind: 'month', stepMonths: 6, approxDays: 180, format: { month: 'short', year: 'numeric' }, minSpacingPx: 52 },
  { id: 'year-1', kind: 'year', stepYears: 1, approxDays: 365, format: { year: 'numeric' }, minSpacingPx: 56 },
  { id: 'year-2', kind: 'year', stepYears: 2, approxDays: 730, format: { year: 'numeric' }, minSpacingPx: 60 },
  { id: 'year-5', kind: 'year', stepYears: 5, approxDays: 1825, format: { year: 'numeric' }, minSpacingPx: 64 },
  { id: 'year-10', kind: 'year', stepYears: 10, approxDays: 3650, format: { year: 'numeric' }, minSpacingPx: 70 }
];

const MAX_LABELS = 16;
const MIN_LABELS = 3;

function alignToHour(viewMin: number, stepHours: number): number {
  const start = new Date(viewMin);
  start.setMinutes(0, 0, 0);
  const hour = start.getHours();
  const alignedHour = Math.floor(hour / stepHours) * stepHours;
  start.setHours(alignedHour);
  return start.getTime();
}

function alignToDay(viewMin: number, stepDays: number): number {
  const start = new Date(viewMin);
  start.setHours(0, 0, 0, 0);
  const date = start.getDate();
  const offset = (date - 1) % stepDays;
  start.setDate(date - offset);
  return start.getTime();
}

function alignToWeek(viewMin: number, stepWeeks: number): number {
  const start = new Date(viewMin);
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Align to Monday
  start.setDate(start.getDate() + daysToMonday);

  const anchor = new Date(1970, 0, 5); // Monday, January 5, 1970
  anchor.setHours(0, 0, 0, 0);
  const stepMs = stepWeeks * WEEK_MS;
  const diff = start.getTime() - anchor.getTime();
  const remainder = ((diff % stepMs) + stepMs) % stepMs;

  return start.getTime() - remainder;
}

function alignToMonth(viewMin: number, stepMonths: number): Date {
  const start = new Date(viewMin);
  start.setHours(0, 0, 0, 0);
  start.setDate(1);
  const month = start.getMonth();
  const alignedMonth = month - (month % stepMonths);
  start.setMonth(alignedMonth, 1);
  return start;
}

function alignToYear(viewMin: number, stepYears: number): Date {
  const start = new Date(viewMin);
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  const year = start.getFullYear();
  const alignedYear = Math.floor(year / stepYears) * stepYears;
  start.setFullYear(alignedYear, 0, 1);
  return start;
}

function addMonths(base: Date, months: number): Date {
  const next = new Date(base.getTime());
  next.setMonth(next.getMonth() + months, 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addYears(base: Date, years: number): Date {
  const next = new Date(base.getTime());
  next.setFullYear(next.getFullYear() + years, 0, 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isVisiblePercent(x: number): boolean {
  return x >= -12 && x <= 112;
}

export function useAxisTicks(
  viewMin: number,
  viewMax: number,
  viewRange: number,
  tToX: (t: number) => number
): Tick[] {
  return useMemo(() => {
    const hasValidRange = Number.isFinite(viewMin) && Number.isFinite(viewMax) && Number.isFinite(viewRange) && viewRange > 0;

    if (!hasValidRange || typeof tToX !== 'function') {
      const fallbackLabel = new Intl.DateTimeFormat('en-US', { year: 'numeric' });
      const now = Number.isFinite(viewMin) ? viewMin : Date.now();
      return [{ t: now, label: fallbackLabel.format(new Date(now)), x: 0, scale: 'year' }];
    }

    const spanDays = viewRange / DAY_MS;

    const selectScale = (): ScaleDefinition => {
      let fallback = SCALE_DEFINITIONS[SCALE_DEFINITIONS.length - 1];
      for (const candidate of SCALE_DEFINITIONS) {
        const estimate = spanDays / candidate.approxDays;
        const minimum = candidate.minLabels ?? MIN_LABELS;
        if (estimate < minimum) {
          continue;
        }
        if (estimate <= MAX_LABELS) {
          return candidate;
        }
        if (estimate <= MAX_LABELS * 1.2 && fallback === SCALE_DEFINITIONS[SCALE_DEFINITIONS.length - 1]) {
          fallback = candidate;
        }
      }
      return fallback;
    };

    const scale = selectScale();
    const formatter = new Intl.DateTimeFormat('en-US', scale.format);
    const hourFormatter = scale.kind === 'hour'
      ? new Intl.DateTimeFormat('en-US', scale.stepHours <= 1
        ? { hour: 'numeric', minute: '2-digit', hour12: true }
        : { hour: 'numeric', hour12: true })
      : null;
    const clampPercent = (time: number): number => ((time - viewMin) / viewRange) * 100;

    const candidateTicks: Tick[] = [];
    const tickIndexByTime = new Map<number, number>();

    const pushTick = (
      time: number,
      options?: { label?: string; force?: boolean; replace?: boolean; scaleOverride?: TickScaleKind }
    ) => {
      const { label: customLabel, force = false, replace = false, scaleOverride } = options ?? {};
      if (!Number.isFinite(time)) {
        return;
      }

      const percent = clampPercent(time);
      if (!force && !isVisiblePercent(percent)) {
        return;
      }

      const key = Math.round(time);
      const existingIndex = tickIndexByTime.get(key);

      const effectiveTime = force ? Math.min(Math.max(time, viewMin), viewMax) : time;
      const x = tToX(effectiveTime);
      if (!Number.isFinite(x)) {
        return;
      }

      const date = new Date(time);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      let label = customLabel;
      if (!label) {
        if (scale.kind === 'hour' && hourFormatter) {
          label = hourFormatter.format(date);
        } else if (scale.kind === 'day' && scale.stepDays === 1 && spanDays <= 31) {
          if (date.getDate() === 1) {
            label = formatter.format(date);
          } else {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            label = `${dayName} ${date.getDate()}`;
          }
        } else {
          label = formatter.format(date);
        }
      }

      const resolvedScale = scaleOverride ?? scale.kind;
      const spacingForScale = (() => {
        switch (resolvedScale) {
          case 'month':
            return 40;
          case 'day':
            return 28;
          case 'hour':
            return 22;
          default:
            return scale.minSpacingPx;
        }
      })();

      if (existingIndex !== undefined) {
        if (replace && label) {
          candidateTicks[existingIndex] = { t: time, label, x, scale: resolvedScale };
        }
        return;
      }

      if (replace) {
        for (let i = 0; i < candidateTicks.length; i++) {
          const existingTick = candidateTicks[i];
          if (Math.abs(existingTick.x - x) < spacingForScale) {
            const oldKey = Math.round(existingTick.t);
            tickIndexByTime.delete(oldKey);
            candidateTicks[i] = { t: time, label, x, scale: resolvedScale };
            tickIndexByTime.set(key, i);
            return;
          }
        }
      }

      candidateTicks.push({ t: time, label, x, scale: resolvedScale });
      tickIndexByTime.set(key, candidateTicks.length - 1);
    };

    const approxStepMs = Math.max(DAY_MS, scale.approxDays * DAY_MS);

    switch (scale.kind) {
      case 'hour': {
        const stepMs = scale.stepHours * HOUR_MS;
        let current = alignToHour(viewMin, scale.stepHours) - stepMs;
        while (current <= viewMax + stepMs) {
          if (current >= viewMin - stepMs) {
      pushTick(current);
          }
          current += stepMs;
        }
        break;
      }
      case 'day': {
        const stepMs = scale.stepDays * DAY_MS;
        let current = alignToDay(viewMin, scale.stepDays) - stepMs;
        while (current <= viewMax + stepMs) {
          if (current >= viewMin - stepMs) {
            pushTick(current);
          }
          current += stepMs;
        }
        break;
      }
      case 'week': {
        const stepMs = scale.stepWeeks * WEEK_MS;
        let current = alignToWeek(viewMin, scale.stepWeeks) - stepMs;
        while (current <= viewMax + stepMs) {
          if (current >= viewMin - stepMs) {
            pushTick(current);
          }
          current += stepMs;
        }
        break;
      }
      case 'month': {
        let current = addMonths(alignToMonth(viewMin, scale.stepMonths), -scale.stepMonths);
        while (current.getTime() <= viewMax + approxStepMs) {
          const time = current.getTime();
          if (time >= viewMin - approxStepMs) {
            pushTick(time);
          }
          current = addMonths(current, scale.stepMonths);
        }
        break;
      }
      case 'year': {
        let current = addYears(alignToYear(viewMin, scale.stepYears), -scale.stepYears);
        while (current.getTime() <= viewMax + approxStepMs) {
          const time = current.getTime();
          if (time >= viewMin - approxStepMs) {
            pushTick(time);
          }
          current = addYears(current, scale.stepYears);
        }
        break;
      }
      default:
        break;
    }

    const shouldEnsureMonths = spanDays >= 28 && spanDays <= 370 && (scale.kind === 'day' || scale.kind === 'week' || scale.kind === 'hour');

    if (shouldEnsureMonths) {
      const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
      const firstMonth = alignToMonth(viewMin, 1);
      let cursor = addMonths(firstMonth, -1);
      const endGuard = addMonths(alignToMonth(viewMax, 1), 1);

      while (cursor.getTime() <= endGuard.getTime()) {
        const monthStart = cursor.getTime();
        pushTick(monthStart, {
          label: monthFormatter.format(cursor),
          force: true,
          replace: true,
          scaleOverride: 'month'
        });
        cursor = addMonths(cursor, 1);
      }
    }

    let ticks = candidateTicks.sort((a, b) => a.t - b.t);

    if (ticks.length === 0) {
      const fallbackFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const candidates = [viewMin, (viewMin + viewMax) / 2, viewMax];
      const seenTimes = new Set<number>();

      for (const candidate of candidates) {
        if (!Number.isFinite(candidate) || seenTimes.has(candidate)) {
          continue;
        }
        const percent = clampPercent(candidate);
        if (!isVisiblePercent(percent)) {
          continue;
        }
        const x = tToX(candidate);
        if (!Number.isFinite(x)) {
          continue;
        }
        seenTimes.add(candidate);
        ticks.push({ t: candidate, label: fallbackFormatter.format(new Date(candidate)), x, scale: scale.kind });
      }

      if (ticks.length === 0) {
        const now = Date.now();
        const clampedNow = Math.min(Math.max(now, viewMin), viewMax);
        ticks.push({
          t: now,
          label: fallbackFormatter.format(new Date(now)),
          x: tToX(clampedNow),
          scale: scale.kind
        });
      }
    }

    const applyMinSpacing = (list: Tick[]): Tick[] => {
      if (list.length <= 1) {
        return list;
      }

      const filtered: Tick[] = [list[0]];
      for (let i = 1; i < list.length; i++) {
        const previous = filtered[filtered.length - 1];
        const candidate = list[i];
        const delta = Math.abs(candidate.x - previous.x);

        if (i === list.length - 1) {
          if (delta < scale.minSpacingPx && filtered.length > 0) {
            filtered[filtered.length - 1] = candidate;
          } else {
            filtered.push(candidate);
          }
          continue;
        }

        if (delta >= scale.minSpacingPx) {
          filtered.push(candidate);
        }
      }

      return filtered;
    };

    ticks = applyMinSpacing(ticks);

    const MAX_TICKS = 80;
    if (ticks.length > MAX_TICKS) {
      const sampled: Tick[] = [];
      const lastIndex = ticks.length - 1;
      const denominator = Math.max(1, MAX_TICKS - 1);
      for (let i = 0; i < MAX_TICKS; i++) {
        const rawIndex = Math.floor((i * lastIndex) / denominator);
        const tick = ticks[rawIndex];
        sampled.push(tick);
      }

      const deduped: Tick[] = [];
      const seen = new Set<string>();
      for (const tick of sampled) {
        const key = `${tick.t}-${Math.round(tick.x)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(tick);
      }

      return deduped;
    }

    return ticks;
  }, [viewMin, viewMax, viewRange, tToX]);
}
