import React from 'react';
import { OverlayShell } from '../OverlayShell';

interface DevPanelProps {
  seedRandom: (n: number) => void;
  seedClustered: () => void;
  seedLongRange: () => void;
  clearAll: () => void;
  dragging: boolean;
  onClose: () => void;
  devEnabled: boolean;
  seedRFK: () => void;
  seedJFK: () => void;
  seedNapoleon: () => void;
  seedIncremental: (n: number) => void;
  placeholderMode?: 'off' | 'sparse' | 'dense';
  setPlaceholderMode?: (m: 'off' | 'sparse' | 'dense') => void;
  forceCardMode?: 'auto' | 'full' | 'compact' | 'title' | 'multi';
  setForceCardMode?: (m: 'auto' | 'full' | 'compact' | 'title' | 'multi') => void;
  useSlotLayout?: boolean;
  setUseSlotLayout?: (use: boolean) => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({ seedRandom, seedClustered, seedLongRange, clearAll, dragging, onClose, devEnabled, seedRFK, seedJFK, seedNapoleon, seedIncremental, placeholderMode = 'sparse', setPlaceholderMode, forceCardMode = 'auto', setForceCardMode, useSlotLayout = false, setUseSlotLayout }) => {
  return (
    <OverlayShell id="dev" title="Developer Options" dragging={dragging} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedRandom(5)}>Seed 5</button>
        <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedRandom(10)}>Seed 10</button>
        <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedClustered}>Clustered</button>
        <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedLongRange}>Long-range</button>
        <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedRFK} title="Load RFK 1968 timeline (replaces current events)">RFK 1968</button>
        <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedJFK} title="Load JFK presidency timeline (replaces current events)">JFK 1961-63</button>
        <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={seedNapoleon} title="Load Napoleon Bonaparte timeline (replaces current events)">Napoleon 1769-1821</button>
        
        {/* Incremental Testing Section */}
  <div className="w-full h-px bg-gray-300 my-1"></div>
  <div className="text-gray-700 font-medium text-xs mb-1">Incremental Tests (Slot Analysis)</div>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(1)} title="Add 1 event for slot analysis">+1</button>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(2)} title="Add up to 2 events">+2</button>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(3)} title="Add up to 3 events">+3</button>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(5)} title="Add up to 5 events">+5</button>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(8)} title="Add up to 8 events">+8</button>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(12)} title="Add up to 12 events">+12</button>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(16)} title="Add up to 16 events">+16</button>
  <button type="button" className="rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 px-3 py-1" onClick={() => seedIncremental(24)} title="Add up to 24 events">+24</button>
        
  <button type="button" data-testid="clear-all" className="rounded border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 px-3 py-1" onClick={clearAll}>Clear</button>

        <div className="w-full h-px bg-gray-300 my-2"></div>
  <div className="text-gray-700 font-medium text-xs mb-1">Placeholders</div>
        <div className="flex items-center gap-1">
          <label htmlFor="placeholders-mode" className="text-gray-700">Mode:</label>
          <select id="placeholders-mode" data-testid="placeholder-mode-select" aria-label="Placeholders mode" className="border rounded px-2 py-1 bg-white" value={placeholderMode} onChange={(e) => setPlaceholderMode?.(e.target.value as any)}>
            <option value="off">Off</option>
            <option value="sparse">Sparse</option>
            <option value="dense">Dense</option>
          </select>
        </div>

        <div className="w-full h-px bg-gray-300 my-2"></div>
  <div className="text-gray-700 font-medium text-xs mb-1">Force Degradation</div>
        <div className="flex items-center gap-1">
          <label htmlFor="force-card-mode" className="text-gray-700">Cards:</label>
          <select id="force-card-mode" data-testid="force-mode-select" aria-label="Force card mode" className="border rounded px-2 py-1 bg-white" value={forceCardMode} onChange={(e) => setForceCardMode?.(e.target.value as any)}>
            <option value="auto">Auto</option>
            <option value="full">Full</option>
            <option value="compact">Compact</option>
            <option value="title">Title only</option>
            <option value="multi">Multi-event</option>
          </select>
        </div>

        <div className="w-full h-px bg-gray-300 my-2"></div>
  <div className="text-gray-700 font-medium text-xs mb-1">Layout Engine</div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setUseSlotLayout?.(false)}
            className={`px-3 py-1 text-xs rounded ${!useSlotLayout ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Original
          </button>
          <button 
            type="button" 
            onClick={() => setUseSlotLayout?.(true)}
            className={`px-3 py-1 text-xs rounded ${useSlotLayout ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Slot-Based
          </button>
        </div>
      </div>
      {!devEnabled && <p className="text-[11px] text-gray-400 mt-2">Enable Dev in header to use seeding tools.</p>}
    </OverlayShell>
  );
};
