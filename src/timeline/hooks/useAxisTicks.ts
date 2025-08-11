import { useMemo } from 'react';

export interface Tick {
  t: number;
  label: string;
  x: number; // percent
}

export function useAxisTicks(viewMin: number, viewMax: number, viewRange: number, tToXPercent: (t: number) => number): Tick[] {
  return useMemo(() => {
    const ticks: Tick[] = [];
    if (!isFinite(viewMin) || !isFinite(viewMax) || viewRange <= 0) return ticks;
    const maxLabels = 12;
    const spanDays = viewRange / (24*60*60*1000);
    // Choose unit
    const units: Array<[number, Intl.DateTimeFormatOptions]> = [
      [1, { month: 'short', day: 'numeric' }],
      [7, { month: 'short', day: 'numeric' }],
      [30, { month: 'short' }],
      [90, { month: 'short', year: 'numeric' }],
      [180, { month: 'short', year: 'numeric' }],
      [365, { year: 'numeric' }],
      [365*5, { year: 'numeric' }],
      [365*10, { year: 'numeric' }],
    ];
    let chosen = units[0];
    for (const u of units) {
      if (spanDays / u[0] <= maxLabels) { chosen = u; break; }
      chosen = u; // fallthrough last
    }
    const stepDays = chosen[0];
    const fmt = new Intl.DateTimeFormat(undefined, chosen[1]);
    const stepMs = stepDays * 24*60*60*1000;
    // Align start
    const startDay = Math.floor(viewMin / (24*60*60*1000));
    const firstDay = startDay - (startDay % stepDays);
    for (let d = firstDay * 24*60*60*1000; d <= viewMax; d += stepMs) {
      if (d < viewMin - stepMs) continue;
      const x = tToXPercent(d);
      if (x < 0 || x > 100) continue;
      ticks.push({ t: d, label: fmt.format(new Date(d)), x });
    }
    // Fallback: ensure at least start/end tick if none landed inside
    if (ticks.length === 0) {
      ticks.push({ t: viewMin, label: fmt.format(new Date(viewMin)), x: tToXPercent(viewMin) });
      if (Math.abs(viewMax - viewMin) > 60 * 60 * 1000) {
        ticks.push({ t: viewMax, label: fmt.format(new Date(viewMax)), x: tToXPercent(viewMax) });
      }
    }
    return ticks.slice(0, 60);
  }, [viewMin, viewMax, viewRange, tToXPercent]);
}
