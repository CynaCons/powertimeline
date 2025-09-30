import type { Event } from '../types';

// Debounced save with drag guard
export class EventStorage {
  private key: string;
  private timeout: NodeJS.Timeout | null = null;
  private delay: number;
  private dragging = false;
  constructor(key = 'powertimeline-events', delay = 300) { this.key = key; this.delay = delay; }
  setDragging(d: boolean) { this.dragging = d; }
  load(): Event[] {
    try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) as Event[] : []; } catch { return []; }
  }
  save(events: Event[]) {
    if (this.dragging) return; // skip while dragging
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      try { localStorage.setItem(this.key, JSON.stringify(events)); } catch {
        // Ignore localStorage errors
      }
    }, this.delay);
  }
  writeThrough(events: Event[]) { // immediate (used during drag updates)
    try {
      localStorage.setItem(this.key, JSON.stringify(events));
    } catch {
      // Ignore localStorage errors
    }
  }
}
