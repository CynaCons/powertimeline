import { useMemo } from 'react';

export interface Tick {
  t: number;
  label: string;
  x: number; // percent
}

export function useAxisTicks(viewMin: number, viewMax: number, viewRange: number, tToXPercent: (t: number) => number): Tick[] {
  return useMemo(() => {
    const ticks: Tick[] = [];

    // Validate input parameters
    if (!isFinite(viewMin) || !isFinite(viewMax) || viewRange <= 0 || typeof tToXPercent !== 'function') {
      // Return a basic fallback tick if inputs are invalid
      return [{
        t: Date.now(),
        label: new Date().getFullYear().toString(),
        x: 50
      }];
    }
    
    const maxLabels = 15; // Increased for better granularity at deep zoom
    const spanDays = viewRange / (24*60*60*1000);
    
    // Enhanced adaptive scale system with day-level granularity
    const units: Array<[number, Intl.DateTimeFormatOptions, string]> = [
      // Sub-day scales for extreme zoom (hours)
      [1/24, { month: 'short', day: 'numeric', hour: 'numeric' }, 'hour'],
      [1/12, { month: 'short', day: 'numeric', hour: 'numeric' }, '2-hour'],
      [1/8, { month: 'short', day: 'numeric', hour: 'numeric' }, '3-hour'],
      [1/4, { month: 'short', day: 'numeric', hour: 'numeric' }, '6-hour'],
      [1/2, { month: 'short', day: 'numeric', hour: 'numeric' }, '12-hour'],
      
      // Day-level scales (smallest unit as requested)
      [1, { month: 'short', day: 'numeric' }, 'daily'],
      [2, { month: 'short', day: 'numeric' }, '2-day'],
      [3, { month: 'short', day: 'numeric' }, '3-day'],
      [7, { month: 'short', day: 'numeric' }, 'weekly'],
      [14, { month: 'short', day: 'numeric' }, 'bi-weekly'],
      
      // Monthly and beyond
      [30, { month: 'short', year: '2-digit' }, 'monthly'],
      [60, { month: 'short', year: '2-digit' }, 'bi-monthly'],
      [90, { month: 'short', year: 'numeric' }, 'quarterly'],
      [180, { month: 'short', year: 'numeric' }, 'semi-annual'],
      [365, { year: 'numeric' }, 'annual'],
      [365*2, { year: 'numeric' }, 'bi-annual'],
      [365*5, { year: 'numeric' }, '5-year'],
      [365*10, { year: 'numeric' }, 'decade'],
    ];
    
    // Select appropriate scale based on span
    let chosen = units[units.length - 1]; // Default to largest scale
    for (const u of units) {
      const tickCount = spanDays / u[0];
      if (tickCount <= maxLabels && tickCount >= 3) { 
        chosen = u; 
        break; 
      }
    }
    
    const [stepDays, formatOptions, scaleType] = chosen;
    const fmt = new Intl.DateTimeFormat('en-US', formatOptions);
    const stepMs = stepDays * 24*60*60*1000;
    
    // Smart alignment based on scale type
    let alignedStart: number;
    const startDate = new Date(viewMin);
    
    if (scaleType.includes('hour')) {
      // Hour-based alignment
      startDate.setMinutes(0, 0, 0);
      const stepHours = stepDays * 24;
      const currentHour = startDate.getHours();
      startDate.setHours(Math.floor(currentHour / stepHours) * stepHours);
      alignedStart = startDate.getTime();
    } else if (scaleType === 'daily' || scaleType.includes('day')) {
      // Day-based alignment
      startDate.setHours(0, 0, 0, 0);
      alignedStart = startDate.getTime();
    } else if (scaleType.includes('week')) {
      // Week alignment (Monday)
      startDate.setHours(0, 0, 0, 0);
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(startDate.getDate() + daysToMonday);
      alignedStart = startDate.getTime();
    } else if (scaleType.includes('month') || scaleType.includes('quarter')) {
      // Month alignment
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      alignedStart = startDate.getTime();
    } else {
      // Year alignment
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      alignedStart = startDate.getTime();
    }
    
    // Generate ticks with proper alignment
    for (let t = alignedStart; t <= viewMax + stepMs; t += stepMs) {
      if (t < viewMin - stepMs) continue;
      const x = tToXPercent(t);
      if (x < -5 || x > 105) continue; // Allow slight overflow for edge labels
      
      const tickDate = new Date(t);
      let label = fmt.format(tickDate);
      
      // Enhanced labeling for day-level scales
      if (scaleType === 'daily' && spanDays <= 31) {
        // Show day of week for daily scale in short spans
        const dayName = tickDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = tickDate.getDate();
        label = tickDate.getDate() === 1 ? 
          fmt.format(tickDate) : // Show full date on first of month
          `${dayName} ${dayNum}`; // Show "Mon 15" format
      }
      
      ticks.push({ t, label, x });
    }
    
    // Ensure we have reasonable tick density - improved fallback
    if (ticks.length === 0) {
      // Create robust emergency fallback ticks
      const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' });
      const midPoint = (viewMin + viewMax) / 2;

      ticks.push({
        t: viewMin,
        label: fmt.format(new Date(viewMin)),
        x: tToXPercent(viewMin)
      });

      if (viewRange > 60 * 60 * 1000) { // More than 1 hour
        ticks.push({
          t: midPoint,
          label: fmt.format(new Date(midPoint)),
          x: tToXPercent(midPoint)
        });
        ticks.push({
          t: viewMax,
          label: fmt.format(new Date(viewMax)),
          x: tToXPercent(viewMax)
        });
      }
    }

    const finalTicks = ticks.slice(0, 50); // Cap at 50 ticks for performance

    // Ensure we always return at least one tick
    if (finalTicks.length === 0) {
      finalTicks.push({
        t: viewMin || Date.now(),
        label: new Date(viewMin || Date.now()).getFullYear().toString(),
        x: 50
      });
    }

    return finalTicks;
  }, [viewMin, viewMax, viewRange, tToXPercent]);
}
