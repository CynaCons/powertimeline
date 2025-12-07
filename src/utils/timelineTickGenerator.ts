/**
 * Timeline Tick Generation Utility
 * 
 * Generates adaptive tick marks for the timeline based on the visible time range,
 * providing appropriate granularity from years down to individual days.
 */

export interface TickMark {
  time: number; // Timestamp
  x: number; // X position on timeline
  level: 'major' | 'minor' | 'micro'; // Visual hierarchy level
  label?: string; // Text label (only for major ticks)
  date: Date; // Date object for convenience
}

export interface TickGeneratorConfig {
  minDate: number; // Start timestamp
  maxDate: number; // End timestamp
  leftMargin: number; // Left margin in pixels
  usableWidth: number; // Available timeline width
  maxTicks?: number; // Maximum number of ticks (default: 50)
}

export interface TimeRange {
  duration: number;
  unit: 'hour' | 'day' | 'week' | 'month' | 'year' | 'decade';
  count: number;
}

/**
 * Determine the appropriate time unit and interval based on the visible range
 */
function determineTimeUnit(rangeMs: number): TimeRange {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day; // Average month
  const year = 365 * day;
  const decade = 10 * year;
  
  if (rangeMs < hour) {
    return { duration: 15 * minute, unit: 'hour', count: Math.ceil(rangeMs / (15 * minute)) };
  } else if (rangeMs < day) {
    return { duration: hour, unit: 'hour', count: Math.ceil(rangeMs / hour) };
  } else if (rangeMs < week) {
    return { duration: day, unit: 'day', count: Math.ceil(rangeMs / day) };
  } else if (rangeMs < 6 * month) { // Extended threshold for day granularity up to 6 months
    return { duration: day, unit: 'day', count: Math.ceil(rangeMs / day) };
  } else if (rangeMs < year) {
    return { duration: week, unit: 'week', count: Math.ceil(rangeMs / week) };
  } else if (rangeMs < 2 * year) {
    return { duration: month, unit: 'month', count: Math.ceil(rangeMs / month) };
  } else if (rangeMs < decade) {
    return { duration: year, unit: 'year', count: Math.ceil(rangeMs / year) };
  } else {
    return { duration: decade, unit: 'decade', count: Math.ceil(rangeMs / decade) };
  }
}

/**
 * Format date label based on the time unit being displayed
 */
function formatDateLabel(date: Date, unit: TimeRange['unit']): string {
  // const options: Intl.DateTimeFormatOptions = {}; // Unused variable
  
  switch (unit) {
    case 'hour':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric' 
      });
    
    case 'day':
      // For day view, show date and day of week for better context
      if (date.getDate() === 1) {
        // First of month - show month
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (date.getDay() === 1) {
        // Monday - show day for weekly reference
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.getDate().toString();
      }
    
    case 'week':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    case 'month':
      if (date.getMonth() === 0) {
        // January - show year
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
    
    case 'year':
      return date.getFullYear().toString();
    
    case 'decade': {
      const decade = Math.floor(date.getFullYear() / 10) * 10;
      return `${decade}s`;
    }
    
    default:
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

/**
 * Generate tick marks aligned to natural time boundaries
 */
function generateAlignedTicks(
  startDate: Date, 
  endDate: Date, 
  timeRange: TimeRange,
  config: TickGeneratorConfig
): TickMark[] {
  const ticks: TickMark[] = [];
  const { minDate, maxDate, leftMargin, usableWidth, maxTicks = 50 } = config;
  const totalRange = maxDate - minDate;
  
  const current = new Date(startDate);
  let tickCount = 0;
  
  // Align to natural boundaries
  switch (timeRange.unit) {
    case 'hour':
      current.setMinutes(0, 0, 0);
      break;
    case 'day':
      current.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      // Align to Monday
      const dayOfWeek = current.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      current.setDate(current.getDate() + daysToMonday);
      current.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      current.setDate(1);
      current.setHours(0, 0, 0, 0);
      break;
    case 'year':
      current.setMonth(0, 1);
      current.setHours(0, 0, 0, 0);
      break;
    case 'decade': {
      const year = current.getFullYear();
      const decadeStart = Math.floor(year / 10) * 10;
      current.setFullYear(decadeStart, 0, 1);
      current.setHours(0, 0, 0, 0);
      break;
    }
  }
  
  while (current <= endDate && tickCount < maxTicks) {
    const timestamp = current.getTime();
    if (timestamp >= minDate && timestamp <= maxDate) {
      
      // Calculate position
      const ratio = (timestamp - minDate) / totalRange;
      const x = leftMargin + (usableWidth * ratio);
      
      // Determine tick level and whether to show label
      let level: TickMark['level'] = 'minor';
      let showLabel = false;
      
      switch (timeRange.unit) {
        case 'hour':
          level = current.getHours() % 6 === 0 ? 'major' : 'minor';
          showLabel = current.getHours() % 6 === 0;
          break;
        case 'day':
          if (current.getDate() === 1) {
            level = 'major';
            showLabel = true;
          } else if (current.getDay() === 1) {
            level = 'minor';
            showLabel = true;
          } else {
            level = 'micro';
            showLabel = false;
          }
          break;
        case 'week':
          level = current.getDate() <= 7 ? 'major' : 'minor';
          showLabel = current.getDate() <= 7;
          break;
        case 'month':
          level = current.getMonth() === 0 ? 'major' : 'minor';
          showLabel = true;
          break;
        case 'year':
          level = current.getFullYear() % 10 === 0 ? 'major' : 'minor';
          showLabel = true;
          break;
        case 'decade':
          level = 'major';
          showLabel = true;
          break;
      }
      
      ticks.push({
        time: timestamp,
        x,
        level,
        label: showLabel ? formatDateLabel(current, timeRange.unit) : undefined,
        date: new Date(current)
      });
    }
    
    // Advance to next tick
    switch (timeRange.unit) {
      case 'hour':
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'year':
        current.setFullYear(current.getFullYear() + 1);
        break;
      case 'decade':
        current.setFullYear(current.getFullYear() + 10);
        break;
    }
    
    tickCount++;
  }
  
  return ticks;
}

/**
 * Main function to generate adaptive timeline tick marks
 */
export function generateTimelineTicks(config: TickGeneratorConfig): TickMark[] {
  const { minDate, maxDate } = config;
  const range = maxDate - minDate;
  
  if (range <= 0) {
    return [];
  }
  
  const timeRange = determineTimeUnit(range);
  const startDate = new Date(minDate);
  const endDate = new Date(maxDate);
  
  return generateAlignedTicks(startDate, endDate, timeRange, config);
}

/**
 * Get CSS classes for tick mark styling based on level
 */
export function getTickMarkClasses(level: TickMark['level']): string {
  const baseClasses = "absolute bg-gray-600";
  
  switch (level) {
    case 'major':
      return `${baseClasses} w-0.5 h-3 bg-gray-700`; // Tallest, darkest
    case 'minor':
      return `${baseClasses} w-0.5 h-2 bg-gray-600`; // Medium height
    case 'micro':
      return `${baseClasses} w-px h-1 bg-gray-400`; // Shortest, lightest
    default:
      return `${baseClasses} w-0.5 h-2`;
  }
}
